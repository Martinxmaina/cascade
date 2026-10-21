"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Price = { resultType: string; label: string; credits: number; active: boolean };
type Supp = { id: string; value: string; kind: string };

export function SettingsView(props: {
  admin: boolean; prices: Price[]; mode: "fixed" | "cost_plus"; markup: number; floor: number; suppressions: Supp[];
}) {
  const router = useRouter();
  const [prices, setPrices] = useState(props.prices);
  const [mode, setMode] = useState(props.mode);
  const [markup, setMarkup] = useState(props.markup);
  const [floor, setFloor] = useState(props.floor);
  const [saved, setSaved] = useState("");
  const [optout, setOptout] = useState("");

  async function save() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode, markup, floor,
        prices: prices.map(({ resultType, credits, active }) => ({ resultType, credits, active })),
      }),
    });
    setSaved(res.ok ? "Saved." : "Could not save.");
  }

  async function suppress(method: "POST" | "DELETE", value: string) {
    if (!value.trim()) return;
    await fetch("/api/suppressions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, ...(method === "POST" ? { reason: "Opt-out request" } : {}) }),
    });
    setOptout("");
    router.refresh();
  }

  return (
    <div className="stack" style={{ gap: 32 }}>
      {props.admin && (
        <section>
          <h3 style={{ marginBottom: 12 }}>Pricing</h3>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="row" style={{ gap: 24 }}>
              <label className="row" style={{ gap: 8 }}>
                <input type="radio" checked={mode === "fixed"} onChange={() => setMode("fixed")} /> Fixed price list
              </label>
              <label className="row" style={{ gap: 8 }}>
                <input type="radio" checked={mode === "cost_plus"} onChange={() => setMode("cost_plus")} /> Cost plus markup
              </label>
            </div>
            {mode === "cost_plus" && (
              <div className="row" style={{ gap: 16, marginTop: 16 }}>
                <label className="field" style={{ width: 160 }}>
                  <span className="label">Markup (x Treg cost)</span>
                  <input className="input" type="number" min={1} value={markup} onChange={(e) => setMarkup(Number(e.target.value))} />
                </label>
                <label className="field" style={{ width: 160 }}>
                  <span className="label">Floor (credits)</span>
                  <input className="input" type="number" min={0} step={0.1} value={floor} onChange={(e) => setFloor(Number(e.target.value))} />
                </label>
              </div>
            )}
          </div>
          <div className="card" style={{ overflow: "hidden", opacity: mode === "fixed" ? 1 : 0.55 }}>
            <table className="table">
              <thead><tr><th>Result</th><th className="r">Credits</th><th>Active</th></tr></thead>
              <tbody>
                {prices.map((p, i) => (
                  <tr key={p.resultType}>
                    <td>{p.label}</td>
                    <td className="r">
                      <input
                        className="input num" type="number" min={0} step={0.1} style={{ width: 100, textAlign: "right" }}
                        value={p.credits}
                        onChange={(e) => setPrices(prices.map((x, j) => (j === i ? { ...x, credits: Number(e.target.value) } : x)))}
                      />
                    </td>
                    <td>
                      <input type="checkbox" checked={p.active}
                        onChange={(e) => setPrices(prices.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ gap: 12, marginTop: 16 }}>
            <button className="btn" onClick={save}>Save pricing</button>
            <span className="muted" role="status">{saved}</span>
          </div>
        </section>
      )}

      <section>
        <h3 style={{ marginBottom: 12 }}>Opt-out list</h3>
        <p className="muted" style={{ marginBottom: 12 }}>Emails and domains here are never processed or returned.</p>
        <div className="row" style={{ gap: 8, marginBottom: 12, maxWidth: 480 }}>
          <input className="input" placeholder="name@company.com or company.com" value={optout} onChange={(e) => setOptout(e.target.value)} />
          <button className="btn" style={{ width: 100 }} onClick={() => suppress("POST", optout)}>Add</button>
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead><tr><th>Value</th><th>Type</th><th /></tr></thead>
            <tbody>
              {props.suppressions.length === 0 && <tr><td colSpan={3} className="muted">No opt-outs yet.</td></tr>}
              {props.suppressions.map((s) => (
                <tr key={s.id}>
                  <td>{s.value}</td><td className="muted">{s.kind}</td>
                  <td className="r"><button className="btn secondary" style={{ height: 30 }} onClick={() => suppress("DELETE", s.value)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
