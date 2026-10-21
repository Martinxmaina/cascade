// Small CSS-animated demos for the 2x2 feature grid. Each shows its final state without motion.
const chip = (name: string, bg: string, ink: string, cls = "") => (
  <span className={`pchip ${cls}`} style={{ background: bg, color: ink }}>{name}</span>
);

export function IcpPanel() {
  return (
    <div className="panel-demo">
      <div className="mini-card light">
        <b>Small UK and US accounting firms</b>
        <div className="seq">
          {["Accounting", "GB, US", "10 to 50 staff", "Managing Partner", "Owner"].map((c, i) => (
            <span key={c} className="chip-l" style={{ animationDelay: `${i * 0.5}s` }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WaterfallPanel() {
  return (
    <div className="panel-demo">
      <div className="wf-row">
        <span className="who">A. Patel</span>
        <span className="step s1">{chip("QuickEnrich", "#dff3ea", "#2f7d5b")}</span>
        <span className="step s2">{chip("Kitt", "#dcebfa", "#2f6aa8")}</span>
        <span className="step s3">{chip("AI Ark", "#ece5f7", "#6a4fa3")}</span>
        <span className="badge ok hitb">Verified</span>
      </div>
      <p className="label">Two misses cost nothing. One hit costs 0.5 cents.</p>
    </div>
  );
}

export function CsvPanel() {
  const rows = ["ana@brightly.co", "jo@fenwick.uk", "sam@lumen.io", "lee@corbel.com"];
  return (
    <div className="panel-demo">
      <div className="csv">
        {rows.map((r, i) => (
          <div key={r}><span>{r}</span><span className="tick" style={{ animationDelay: `${i * 0.6}s` }}>Verified</span></div>
        ))}
      </div>
    </div>
  );
}

export function ReceiptPanel() {
  const lines: [string, string][] = [["Companies, 50", "5 credits"], ["Decision makers, 41", "41 credits"], ["Verified emails, 29", "145 credits"], ["Catch-all, 5", "10 credits"]];
  return (
    <div className="panel-demo">
      <div className="receipt">
        {lines.map(([a, b], i) => (
          <div key={a} className="rline" style={{ animationDelay: `${i * 0.55}s` }}><span>{a}</span><span>{b}</span></div>
        ))}
        <div className="rline total" style={{ animationDelay: "2.4s" }}><span>Total</span><span>201 credits</span></div>
      </div>
    </div>
  );
}
