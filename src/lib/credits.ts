import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "./auth";

const { creditLedger: ledger, runs } = schema;

// Credits are floats (0.1 per company), so round to avoid drift in sums.
const r = (n: number) => Math.round(n * 1e6) / 1e6;

export function balance(userId: string): number {
  const row = db
    .select({
      v: sql<number>`coalesce(sum(case
        when ${ledger.kind} in ('grant','topup','refund') then ${ledger.credits}
        when ${ledger.kind} = 'hold' then -${ledger.credits}
        else 0 end), 0)`,
    })
    .from(ledger)
    .where(eq(ledger.userId, userId))
    .get();
  return r(row?.v ?? 0);
}

export function addCredits(
  userId: string,
  kind: "grant" | "topup",
  credits: number,
  opts: { note?: string; stripeSessionId?: string } = {},
) {
  // stripe_session_id is unique, so a replayed webhook cannot credit twice.
  const res = db
    .insert(ledger)
    .values({ userId, kind, credits, note: opts.note, stripeSessionId: opts.stripeSessionId })
    .onConflictDoNothing()
    .run();
  return res.changes > 0;
}

export const holdCredits = (userId: string, runId: string, credits: number) =>
  db.transaction((tx) => {
    if (balance(userId) < credits) throw new HttpError(402, "Not enough credits for this run.");
    tx.insert(ledger).values({ userId, kind: "hold", credits, runId, note: "Held for run" }).run();
    tx.update(runs).set({ heldCredits: sql`${runs.heldCredits} + ${credits}` }).where(eq(runs.id, runId)).run();
  });

// Records revenue for a result. Fails (returns false) once the hold is used up,
// which is the signal for the job runner to pause and ask for a top-up.
export function chargeRun(userId: string, runId: string, credits: number, note: string) {
  return db.transaction((tx) => {
    const run = tx.select().from(runs).where(eq(runs.id, runId)).get();
    if (!run || run.chargedCredits + credits > run.heldCredits + 1e-9) return false;
    tx.insert(ledger).values({ userId, kind: "charge", credits, runId, note }).run();
    tx.update(runs).set({ chargedCredits: r(run.chargedCredits + credits) }).where(eq(runs.id, runId)).run();
    return true;
  });
}

// Refunds the unused part of the hold. Safe to call twice: only one refund is ever written.
export function settleRun(userId: string, runId: string, note = "Unused hold refunded") {
  return db.transaction((tx) => {
    const run = tx.select().from(runs).where(eq(runs.id, runId)).get();
    if (!run) return 0;
    const done = tx
      .select({ n: sql<number>`count(*)` })
      .from(ledger)
      .where(and(eq(ledger.runId, runId), eq(ledger.kind, "refund")))
      .get();
    const refund = r(run.heldCredits - run.chargedCredits);
    if ((done?.n ?? 0) > 0 || refund <= 0) return 0;
    tx.insert(ledger).values({ userId, kind: "refund", credits: refund, runId, note }).run();
    return refund;
  });
}
