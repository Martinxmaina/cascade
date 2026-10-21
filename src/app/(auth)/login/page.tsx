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
        <h2 style={{ fontSize: 28 }}>Log in</h2>
        <p className="muted" style={{ margin: "6px 0 20px" }}>Welcome back.</p>
        <AuthForm mode="login" />
        <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>New here? <a href="/signup">Start free</a></p>
      </div>
    </main>
  );
}
