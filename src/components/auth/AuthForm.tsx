"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Errors = Partial<Record<"name" | "email" | "password" | "agreed" | "form", string>>;

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    const password = String(f.get("password") ?? "");
    const next: Errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email.";
    if (mode === "signup") {
      if (!String(f.get("name") ?? "").trim()) next.name = "Enter your name.";
      if (password.length < 10) next.password = "Use at least 10 characters.";
      if (!f.get("agreed")) next.agreed = "Agree to the outreach terms to continue.";
    } else if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "signup"
          ? { name: f.get("name"), email, password, agreed: true }
          : { email, password },
      ),
    });
    if (res.ok) {
      router.push(mode === "signup" ? "/onboarding" : "/home");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setErrors({ form: data.error ?? "Something went wrong." });
    setBusy(false);
  }

  return (
    <form onSubmit={submit} noValidate className="stack">
      {mode === "signup" && (
        <label className="field">
          <span className="label">Name</span>
          <input className="input" name="name" autoComplete="name" />
          <div className="field-error" role="alert">{errors.name}</div>
        </label>
      )}
      <label className="field">
        <span className="label">Email</span>
        <input className="input" name="email" type="email" autoComplete="email" />
        <div className="field-error" role="alert">{errors.email}</div>
      </label>
      <label className="field">
        <span className="label">Password</span>
        <input
          className="input"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        <div className="field-error" role="alert">{errors.password}</div>
      </label>
      {mode === "signup" && (
        <div>
          <label className="row" style={{ gap: 10, alignItems: "flex-start" }}>
            <input type="checkbox" name="agreed" style={{ marginTop: 4 }} />
            <span className="muted" style={{ fontSize: 14 }}>
              I&apos;ll use Cascade for B2B outreach and respect opt-outs
            </span>
          </label>
          <div className="field-error" role="alert">{errors.agreed}</div>
        </div>
      )}
      <div className="field-error" role="alert" style={{ marginBottom: 4 }}>{errors.form}</div>
      <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
