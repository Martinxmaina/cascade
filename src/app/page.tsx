import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Wash, Drop } from "@/components/watercolour/Watercolour";
import { Reveal } from "@/components/landing/Reveal";
import { WaterfallCanvas } from "@/components/landing/WaterfallCanvas";
import { Engine } from "@/components/landing/Engine";
import { Faq } from "@/components/landing/Faq";
import { IcpPanel, WaterfallPanel, CsvPanel, ReceiptPanel } from "@/components/landing/Panels";
import "./landing.css";

const STEPS = [
  ["01", "Tell us your business", "One sentence and your website."],
  ["02", "Get your ICP", "Opus reads your site and writes who buys."],
  ["03", "We find the people", "Matching companies and the decision maker at each."],
  ["04", "The waterfall verifies them", "Five providers, cheapest first, you only pay for hits."],
];

const FEATURES = [
  ["ICP from your website", "Opus reads your pages and writes the segment, titles, sizes and countries.", <IcpPanel key="a" />],
  ["The waterfall", "Each lead tries the cheapest provider first and moves on after a miss.", <WaterfallPanel key="b" />],
  ["Clean any list", "Import a CSV, map the columns, see the price, run.", <CsvPanel key="c" />],
  ["See every cent", "Every row has a cost, every run has a receipt.", <ReceiptPanel key="d" />],
] as const;

const INCLUDED = [
  "ICP from your website",
  "Company and decision-maker search",
  "Five-provider email waterfall",
  "Verification included",
  "CSV and Excel export",
  "Clean your own lists",
];

const WORDS_A = ["pay per hit", "misses free", "verified"];
const WORDS_B = ["your ICP", "five providers", "one bill"];

function Cta() {
  return (
    <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
      <Link className="btn" href="/signup">Start free</Link>
      <Link className="btn secondary" href="#engine">See a run</Link>
    </div>
  );
}

export default async function Landing() {
  if (await getUser()) redirect("/home");
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="rail row" style={{ justifyContent: "space-between", height: 64 }}>
          <Link href="/" className="logo" style={{ padding: 0, color: "var(--ink)" }}><Drop /> Cascade</Link>
          <nav className="lp-links" aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#questions">Questions</a>
          </nav>
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn secondary" href="/login">Log in</Link>
            <Link className="btn" href="/signup">Start free</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <Wash style={{ width: 860, top: -200, right: -240 }} tone={200} seed={4} />
        <div className="rail hero-grid">
          <div className="hero-copy">
            <span className="pill run"><i className="dot pulse" /> live: emails pouring in</span>
            <h1 style={{ margin: "20px 0" }}>Tell us what you sell. Get the people who&apos;ll buy it.</h1>
            <p className="lp-sub">
              Cascade reads your website, writes your ideal customer profile, and finds verified
              decision makers by trying five email providers until one hits.
            </p>
            <Cta />
          </div>
          <div className="hero-canvas">
            <span className="corner tl">[ 5 providers ]</span>
            <span className="corner tr">[ misses free ]</span>
            <span className="corner bl">[ verified ]</span>
            <span className="corner br">[ 1 cent ]</span>
            <WaterfallCanvas />
          </div>
        </div>
      </section>

      <section className="sec" id="how">
        <div className="rail">
          <Reveal><span className="eyebrow">[ how it works ]</span><h2 style={{ margin: "12px 0 32px" }}>From your website to a verified list.</h2></Reveal>
          <div className="how">
            {STEPS.map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 100}>
                <div className="how-row"><span className="how-n">{n}</span><h3>{t}</h3><p className="muted">{d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="rail">
          <Reveal><span className="eyebrow">[ what it does ]</span><h2 style={{ margin: "12px 0 32px" }}>Everything a lead tool should do, priced per result.</h2></Reveal>
          <div className="features">
            {FEATURES.map(([t, d, demo], i) => (
              <Reveal key={t} delay={(i % 2) * 100}>
                <div className="feature"><div className="demo">{demo}</div><h3>{t}</h3><p className="muted">{d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="rail">
          <Reveal>
            <span className="eyebrow">[ why a waterfall ]</span>
            <h2 style={{ margin: "12px 0 24px" }}>One provider finds some. Five find most.</h2>
            <div className="card bake">
              <Wash style={{ width: 420, top: -80, right: -60 }} tone={100} seed={9} />
              <div style={{ position: "relative" }}>
                <h3>Run your own bake-off</h3>
                <p className="muted" style={{ margin: "6px 0 16px", maxWidth: 520 }}>
                  Pick 100 of your own leads. Cascade runs each provider alone and then the waterfall,
                  and charts how many emails each one found. No sample numbers, only yours.
                </p>
                <Link className="btn" href="/signup">Start free</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="marquee" aria-hidden>
        {[WORDS_A, WORDS_B].map((row, r) => (
          <div key={r} className={`mq-row ${r ? "rev" : ""}`}>
            <div className="mq-track">
              {[0, 1].flatMap((k) => row.map((w, i) => (
                <span key={`${k}-${i}`} className={(i + r) % 2 ? "w300" : ""}>{w} <em>{"///"}</em> </span>
              )))}
            </div>
          </div>
        ))}
      </section>

      <Engine />

      <section className="sec" id="pricing">
        <div className="rail">
          <Reveal><span className="eyebrow">[ pricing ]</span><h2 style={{ margin: "12px 0 32px" }}>Pay for results, not seats.</h2></Reveal>
          <Reveal>
            <div className="card price">
              <Wash style={{ width: 380, top: -90, left: -80 }} tone={200} seed={2} />
              <div className="price-l">
                <h3 style={{ fontSize: 28 }}>From 5 cents per verified email</h3>
                <p className="muted" style={{ margin: "8px 0 20px" }}>50 free credits on sign up</p>
                <Link className="btn" href="/signup">Start free</Link>
              </div>
              <ul className="price-r">
                {INCLUDED.map((x) => <li key={x}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="var(--ok)" strokeWidth="1.8" /></svg>{x}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec" id="questions">
        <div className="rail">
          <Reveal><span className="eyebrow">[ questions ]</span><h2 style={{ margin: "12px 0 24px" }}>Questions</h2><Faq /></Reveal>
        </div>
      </section>

      <section className="final">
        <Wash style={{ width: 700, top: -120, left: "50%", marginLeft: -350 }} tone={200} seed={6} />
        <div className="rail" style={{ position: "relative", textAlign: "center" }}>
          <Reveal>
            <h2 style={{ margin: "0 auto 24px", maxWidth: 640 }}>Your next 50 customers are one sentence away.</h2>
            <div style={{ display: "flex", justifyContent: "center" }}><Cta /></div>
          </Reveal>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="rail foot-grid">
          <div><div className="logo" style={{ padding: 0 }}><Drop /> Cascade</div><p className="label" style={{ marginTop: 8 }}>Data via Treg</p></div>
          <div><span className="label">Product</span><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#questions">Questions</a></div>
          <div><span className="label">Company</span><Link href="/login">Log in</Link><Link href="/signup">Start free</Link></div>
          <div><span className="label">Legal</span><span>Terms</span><span>Privacy</span><span>Data and opt-out</span></div>
        </div>
      </footer>
    </div>
  );
}
