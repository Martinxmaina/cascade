import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Wash, Drop } from "@/components/watercolour/Watercolour";

// Placeholder landing page. The full landing page is a later phase.
export default async function Landing() {
  if (await getUser()) redirect("/home");
  return (
    <main className="auth-wrap">
      <Wash style={{ width: 900, top: -160, right: -160 }} tone={200} />
      <div style={{ maxWidth: 640, position: "relative" }}>
        <div className="logo" style={{ padding: 0, marginBottom: 24 }}>
          <Drop /> Cascade
        </div>
        <h1>Tell us what you sell. Get the people who&apos;ll buy it.</h1>
        <p className="muted" style={{ fontSize: 17, margin: "16px 0 24px" }}>
          Cascade reads your website, writes your ideal customer profile, and finds verified
          decision makers by trying five email providers until one hits.
        </p>
        <div className="row" style={{ gap: 12 }}>
          <Link className="btn" href="/signup">Start free</Link>
          <Link className="btn secondary" href="/login">Log in</Link>
        </div>
      </div>
    </main>
  );
}
