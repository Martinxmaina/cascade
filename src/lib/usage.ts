import { eq, sql, and, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { env } from "./env";

const { tregCalls, creditLedger: ledger, runs } = schema;

export type TregMeta = { userId: string; runId?: string; step: string };

// The X-Treg-Meta header value. Treg echoes it back in its own records, so Cascade's
// per-customer totals can be reconciled against Treg's.
export const buildMeta = (m: TregMeta) =>
  `user=${m.userId}${m.runId ? `,run=${m.runId}` : ""},step=${m.step}`;

// Called by the Treg client after every call. costMicro comes only from the
// X-Treg-Cost-Micro header; a missing header means no charge and is passed as 0.
export function recordTregCall(c: {
  endpointId: string;
  paramsHash?: string;
  status: number;
  costMicro: number;
  callId?: string | null;
  idempotencyKey?: string;
  meta: TregMeta;
}) {
  db.transaction((tx) => {
    tx.insert(tregCalls)
      .values({
        endpointId: c.endpointId,
        paramsHash: c.paramsHash,
        status: c.status,
        costMicro: c.costMicro,
        callId: c.callId ?? null,
        idempotencyKey: c.idempotencyKey,
        meta: buildMeta(c.meta),
        userId: c.meta.userId,
        runId: c.meta.runId ?? null,
        step: c.meta.step,
      })
      .run();
    if (c.meta.runId && c.costMicro > 0) {
      tx.update(runs)
        .set({ tregCostMicro: sql`${runs.tregCostMicro} + ${c.costMicro}` })
        .where(eq(runs.id, c.meta.runId))
        .run();
    }
  });
}

const DAY = 86_400_000;
const dayKey = (col: unknown) => sql<string>`strftime('%Y-%m-%d', ${col} / 1000, 'unixepoch')`;

export function creditsUsedByDay(userId: string, days = 30) {
  const since = Date.now() - days * DAY;
  const rows = db
    .select({ day: dayKey(ledger.createdAt), credits: sql<number>`sum(${ledger.credits})` })
    .from(ledger)
    .where(and(eq(ledger.userId, userId), eq(ledger.kind, "charge"), gte(ledger.createdAt, since)))
    .groupBy(dayKey(ledger.createdAt))
    .all();
  const byDay = new Map(rows.map((x) => [x.day, x.credits]));
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(Date.now() - (days - 1 - i) * DAY).toISOString().slice(0, 10);
    return { day, credits: byDay.get(day) ?? 0 };
  });
}

// Admin view: what customers paid (credits charged x credit value) against what Treg billed.
export function marginReport(days = 30) {
  const value = env.creditValueUsd();
  const since = Date.now() - days * DAY;

  const rev = db
    .select({ day: dayKey(ledger.createdAt), credits: sql<number>`sum(${ledger.credits})` })
    .from(ledger)
    .where(and(eq(ledger.kind, "charge"), gte(ledger.createdAt, since)))
    .groupBy(dayKey(ledger.createdAt))
    .all();
  const cost = db
    .select({ day: dayKey(tregCalls.createdAt), micro: sql<number>`sum(${tregCalls.costMicro})` })
    .from(tregCalls)
    .where(gte(tregCalls.createdAt, since))
    .groupBy(dayKey(tregCalls.createdAt))
    .all();
  const dayMap = new Map<string, { revenueUsd: number; tregCostUsd: number }>();
  for (const x of rev) dayMap.set(x.day, { revenueUsd: x.credits * value, tregCostUsd: 0 });
  for (const x of cost) {
    const d = dayMap.get(x.day) ?? { revenueUsd: 0, tregCostUsd: 0 };
    d.tregCostUsd = x.micro / 1e6;
    dayMap.set(x.day, d);
  }
  const byDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v, marginUsd: v.revenueUsd - v.tregCostUsd }));

  const group = (col: typeof tregCalls.endpointId | typeof tregCalls.step) =>
    db
      .select({ key: col, micro: sql<number>`sum(${tregCalls.costMicro})`, calls: sql<number>`count(*)` })
      .from(tregCalls)
      .where(gte(tregCalls.createdAt, since))
      .groupBy(col)
      .all()
      .map((x) => ({ key: x.key ?? "unknown", tregCostUsd: x.micro / 1e6, calls: x.calls }))
      .sort((a, b) => b.tregCostUsd - a.tregCostUsd);

  const customers = db
    .select({
      userId: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      bought: sql<number>`coalesce((select sum(credits) from credit_ledger where user_id = ${schema.users.id} and kind = 'topup'), 0)`,
      used: sql<number>`coalesce((select sum(credits) from credit_ledger where user_id = ${schema.users.id} and kind = 'charge'), 0)`,
      micro: sql<number>`coalesce((select sum(cost_micro) from treg_calls where user_id = ${schema.users.id}), 0)`,
    })
    .from(schema.users)
    .all()
    .map((c) => {
      const revenueUsd = c.used * value;
      const tregCostUsd = c.micro / 1e6;
      return {
        userId: c.userId,
        email: c.email,
        name: c.name,
        creditsBought: c.bought,
        creditsUsed: c.used,
        tregCostUsd,
        marginUsd: revenueUsd - tregCostUsd,
        marginPct: revenueUsd > 0 ? ((revenueUsd - tregCostUsd) / revenueUsd) * 100 : null,
      };
    });

  const revenueUsd = byDay.reduce((s, d) => s + d.revenueUsd, 0);
  const tregCostUsd = byDay.reduce((s, d) => s + d.tregCostUsd, 0);
  return {
    days,
    revenueUsd,
    tregCostUsd,
    marginUsd: revenueUsd - tregCostUsd,
    marginPct: revenueUsd > 0 ? ((revenueUsd - tregCostUsd) / revenueUsd) * 100 : null,
    byDay,
    byProvider: group(tregCalls.endpointId),
    byStep: group(tregCalls.step),
    customers,
  };
}

export function receiptsForUser(userId: string) {
  return db
    .select()
    .from(runs)
    .where(eq(runs.userId, userId))
    .orderBy(sql`${runs.createdAt} desc`)
    .limit(50)
    .all()
    .map((run) => ({
      runId: run.id,
      title: run.title,
      status: run.status,
      createdAt: run.createdAt,
      held: run.heldCredits,
      charged: run.chargedCredits,
      refunded: Math.max(0, run.heldCredits - run.chargedCredits),
    }));
}
