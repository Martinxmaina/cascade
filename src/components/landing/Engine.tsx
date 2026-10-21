"use client";
import { useEffect, useRef, useState } from "react";

const PHASES = [
  { title: "A website", caption: "Cascade reads your homepage, pricing, about and customers pages." },
  { title: "An ICP", caption: "Opus turns the text into who buys: industries, sizes, countries, titles." },
  { title: "Companies", caption: "Matching companies appear, de-duplicated by domain." },
  { title: "People", caption: "The decision maker at each company gets attached by title." },
  { title: "Emails", caption: "Five providers, cheapest first. A miss costs nothing." },
  { title: "A list", caption: "A table of verified contacts, with the cost of every cell." },
];

const LOGOS = ["Ab", "Cl", "Dn", "Em", "Fr", "Gt", "Hw", "Ik"];
const NAMES = ["A. Patel", "J. Moore", "S. Okafor", "L. Chen", "R. Evans", "M. Diaz", "K. Walsh", "T. Reid"];

export function Engine() {
  const wrap = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 0.999);
      setPhase(Math.floor(p * PHASES.length));
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={wrap} className="engine" id="engine">
      <div className="engine-sticky">
        <div className="engine-inner">
          <div className="engine-stage" aria-hidden>
            <Stage phase={phase} />
          </div>
          <div className="engine-captions">
            <span className="eyebrow dark">[ the engine ]</span>
            <div className="engine-steps">
              {PHASES.map((p, i) => (
                <div key={p.title} className="engine-cap" data-on={i === phase}>
                  <h2>{p.title}</h2>
                  <p>{p.caption}</p>
                </div>
              ))}
            </div>
            <div className="engine-dots" aria-label={`Step ${phase + 1} of ${PHASES.length}`}>
              {PHASES.map((_, i) => <span key={i} data-on={i <= phase} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stage({ phase }: { phase: number }) {
  return (
    <div className="stage">
      <div className="stage-layer" data-on={phase === 0}>
        {[88, 100, 72, 94, 60, 84, 96, 66].map((w, i) => <i key={i} className="line" style={{ width: `${w}%` }} />)}
      </div>
      <div className="stage-layer" data-on={phase === 1}>
        <div className="mini-card">
          <b>Small UK and US accounting firms</b>
          {["Accounting", "GB, US", "10 to 50 staff", "Managing Partner"].map((c) => <span key={c} className="chip-d">{c}</span>)}
        </div>
      </div>
      <div className="stage-layer" data-on={phase === 2}>
        <div className="grid-logos">{LOGOS.map((l) => <span key={l} className="logo-sq">{l}</span>)}</div>
      </div>
      <div className="stage-layer" data-on={phase === 3}>
        <div className="list-rows">{LOGOS.slice(0, 6).map((l, i) => <div key={l}><span className="logo-sq">{l}</span><span>{NAMES[i]}</span></div>)}</div>
      </div>
      <div className="stage-layer" data-on={phase === 4}>
        <div className="tiers">
          {["#dff3ea", "#dcebfa", "#ece5f7", "#fbe8dc", "#f8f0d2"].map((c, i) => (
            <div key={c} style={{ background: c, width: `${100 - i * 8}%` }}><i className="drop-d" style={{ animationDelay: `${i * 0.25}s` }} /></div>
          ))}
        </div>
      </div>
      <div className="stage-layer" data-on={phase === 5}>
        <div className="list-rows">
          {LOGOS.slice(0, 6).map((l, i) => (
            <div key={l}><span>{NAMES[i]}</span><span className="badge ok">Verified</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
