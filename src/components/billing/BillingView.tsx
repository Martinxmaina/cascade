"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCredits, fmtDate, fmtUsd } from "@/lib/format";
import { Wash } from "@/components/watercolour/Watercolour";

type Entry = { id: string; kind: string; credits: number; runId: string | null; note: string | null; createdAt: number };
type Receipt = { runId: string; title: string | null; status: string; createdAt: number; held: number; charged: number; refunded: number };
type Margin = {
  revenueUsd: number; tregCostUsd: number; marginUsd: number; marginPct: number | null;
  byDay: { day: string; revenueUsd: number; tregCostUsd: number; marginUsd: number }[];
  byProvider: { key: string; tregCostUsd: number; calls: number }[];
  byStep: { key: string; tregCostUsd: number; calls: number }[];
  customers: { userId: string; email: string; name: string; creditsBought: number; creditsUsed: number; tregCostUsd: number; marginUsd: number; marginPct: number | null }[];
};
type Pack = { id: string; credits: number; usd: number };

const SIGN: Record<string, string> = { grant: "+", topup: "+", refund: "+", hold: "-", charge: "" };

export function BillingView(props: {
  balance: number; packs: Pack[]; entries: Entry[]; receipts: Receipt[];
  usage: { day: string; credits: number }[]; margin: Margin | null; creditValue: number; stripe: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"credits" | "ledger" | "receipts" | "margin">("credits");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function buy(packId: string) {
    setBusy(packId);
    setError("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error ?? "Top-up failed.");
    else if (data.url) window.location.assign(data.url);
    else router.refresh();
    setBusy(null);
  }

  const max = Math.max(1, ...props.usage.map((u) => u.credits));
  const spark = props.usage
    .map((u, i) => `${(i / (props.usage.length - 1)) * 240},${40 - (u.credits / max) * 36}`)
    .join(" ");
  const tabs = [
    ["credits", "Credits"], ["ledger", "Ledger"], ["receipts", "Receipts"],
    ...(props.margin ? [["margin", "Margin"]] : []),
  ] as const;

  return (
    <>
      <div role="tablist" className="tabs">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k as typeof tab)}>{l}</button>
        ))}
      </div>

      {tab === "credits" && (
        <div className="stack" style={{ gap: 24 }}>
          <div className="card" style={{ position: "relative", overflow: "hidden", padding: 28, height: 180 }}>
            <Wash style={{ width: 520, top: -140, right: -120 }} tone={200} />
            <div style={{ position: "relative" }}>
              <div className="label">Credits balance</div>
              <div className="big-num" style={{ fontSize: 56, marginTop: 4 }}>{fmtCredits(props.balance)}</div>
              <div className="muted">{fmtUsd(props.balance * props.creditValue)} value</div>
            </div>
            <svg width="240" height="44" style={{ position: "absolute", right: 28, bottom: 24 }} aria-label="Credits used over 30 days">
              <polyline points={spark} fill="none" stroke="var(--water-ink)" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <h3 style={{ marginBottom: 12 }}>Top up</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {props.packs.map((p) => (
                <div key={p.id} className="card" style={{ padding: 20, height: 150 }}>
                  <div className="big-num" style={{ fontSize: 28 }}>{p.credits.toLocaleString("en-US")}</div>
                  <div className="muted" style={{ marginBottom: 16 }}>credits for ${p.usd}</div>
                  <button className="btn" style={{ width: 140 }} disabled={busy !== null} onClick={() => buy(p.id)}>
                    {busy === p.id ? "Working..." : <>Buy <span className="price">${p.usd}</span></>}
                  </button>
                </div>
              ))}
            </div>
            <div className="field-error" role="alert">{error}</div>
            {!props.stripe && <p className="label">Stripe is not set up, so top-ups are added instantly as test credits.</p>}
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead><tr><th>When</th><th>Type</th><th className="r">Credits</th><th>Run</th><th>Note</th></tr></thead>
            <tbody>
              {props.entries.length === 0 && <tr><td colSpan={5} className="muted">No entries yet.</td></tr>}
              {props.entries.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{fmtDate(e.createdAt)}</td>
                  <td>{e.kind}</td>
                  <td className="r num">{SIGN[e.kind]}{fmtCredits(e.credits)}</td>
                  <td className="muted">{e.runId ? e.runId.slice(0, 8) : ""}</td>
                  <td className="muted">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "receipts" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead><tr><th>Run</th><th>Status</th><th className="r">Held</th><th className="r">Charged</th><th className="r">Refunded</th><th>Date</th></tr></thead>
            <tbody>
              {props.receipts.length === 0 && <tr><td colSpan={6} className="muted">No runs yet.</td></tr>}
              {props.receipts.map((r) => (
                <tr key={r.runId}>
                  <td>{r.title ?? r.runId.slice(0, 8)}</td>
                  <td>{r.status}</td>
                  <td className="r num">{fmtCredits(r.held)}</td>
                  <td className="r num">{fmtCredits(r.charged)}</td>
                  <td className="r num">{fmtCredits(r.refunded)}</td>
                  <td className="muted">{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "margin" && props.margin && <MarginTab m={props.margin} />}
    </>
  );
}

function MarginTab({ m }: { m: Margin }) {
  const money = (n: number) => fmtUsd(n, 4);
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="grid-kpi" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          ["Revenue, 30 days", fmtUsd(m.revenueUsd)],
          ["Treg cost, 30 days", money(m.tregCostUsd)],
          ["Margin", fmtUsd(m.marginUsd)],
          ["Margin %", m.marginPct === null ? "None yet" : `${m.marginPct.toFixed(0)}%`],
        ].map(([l, v]) => (
          <div key={l} className="card kpi"><span className="label">{l}</span><span className="big-num">{v}</span></div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, height: 300 }}>
        <div className="label" style={{ marginBottom: 8 }}>Revenue against Treg cost by day (USD)</div>
        {m.byDay.length === 0 ? (
          <p className="muted">No charges yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={m.byDay}>
              <CartesianGrid stroke="var(--line-soft)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--ink-faint)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--ink-faint)" />
              <Tooltip />
              <Bar dataKey="revenueUsd" name="Revenue" fill="var(--wash-300)" />
              <Bar dataKey="tregCostUsd" name="Treg cost" fill="var(--ink-muted)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {([["By provider", m.byProvider], ["By step", m.byStep]] as const).map(([title, list]) => (
          <div key={title} className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead><tr><th>{title}</th><th className="r">Calls</th><th className="r">Treg cost</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={3} className="muted">No Treg calls yet.</td></tr>}
                {list.map((x) => (
                  <tr key={x.key}><td>{x.key}</td><td className="r num">{x.calls}</td><td className="r num">{money(x.tregCostUsd)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="table">
          <thead><tr><th>Customer</th><th className="r">Credits bought</th><th className="r">Credits used</th><th className="r">Treg cost</th><th className="r">Margin</th></tr></thead>
          <tbody>
            {m.customers.map((c) => (
              <tr key={c.userId}>
                <td>{c.name} <span className="muted">{c.email}</span></td>
                <td className="r num">{fmtCredits(c.creditsBought)}</td>
                <td className="r num">{fmtCredits(c.creditsUsed)}</td>
                <td className="r num">{money(c.tregCostUsd)}</td>
                <td className="r num">{fmtUsd(c.marginUsd)}{c.marginPct !== null && ` (${c.marginPct.toFixed(0)}%)`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="label">Treg balance and the low-balance warning arrive with the Treg client.</p>
    </div>
  );
}
