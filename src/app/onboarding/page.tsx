import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Wash } from "@/components/watercolour/Watercolour";

// Placeholder. The fixed-size five-step onboarding card is the next phase.
export default async function Onboarding() {
  if (!(await getUser())) redirect("/login");
  return (
    <main className="auth-wrap">
      <Wash style={{ width: 720, top: -120, right: -120 }} tone={200} />
      <div className="card auth-card">
        <h2 style={{ fontSize: 28 }}>Welcome</h2>
        <p className="muted" style={{ margin: "6px 0 20px" }}>
          Onboarding arrives with the Treg integration. Your 50 free credits are ready.
        </p>
        <Link className="btn" href="/home">Go to Home</Link>
      </div>
    </main>
  );
}
