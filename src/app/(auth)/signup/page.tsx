import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Wash, Drop } from "@/components/watercolour/Watercolour";

export default async function Page() {
  if (await getUser()) redirect("/home");
  return (
    <main className="auth-wrap">
      <Wash style={{ width: 720, top: -120, right: -120 }} tone={200} />
      <div className="card auth-card">
        <div className="logo" style={{ padding: 0, marginBottom: 20 }}>
          <Drop /> Cascade
        </div>
        <h2 style={{ fontSize: 28 }}>Start free</h2>
        <p className="muted" style={{ margin: "6px 0 20px" }}>50 free credits on sign up.</p>
        <AuthForm mode="signup" />
        <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>Already have an account? <a href="/login">Log in</a></p>
      </div>
    </main>
  );
}
