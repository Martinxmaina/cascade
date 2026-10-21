import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { balance } from "@/lib/credits";
import { fmtCredits, fmtUsd } from "@/lib/format";
import { env } from "@/lib/env";
import { Drop, Wash } from "@/components/watercolour/Watercolour";
import { NavLinks } from "@/components/shell/NavLinks";
import { LogoutButton } from "@/components/shell/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const credits = balance(user.id);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo"><Drop /> Cascade</div>
        <NavLinks />
        <div className="sidebar-foot">
          <div className="credits-card">
            <Wash style={{ width: 260, top: -60, right: -90 }} tone={100} seed={7} />
            <div className="label">Credits</div>
            <div className="big-num" style={{ fontSize: 32, marginTop: 4 }}>{fmtCredits(credits)}</div>
            <div className="muted" style={{ fontSize: 13 }}>{fmtUsd(credits * env.creditValueUsd())} value</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div>
        <header className="topbar">
          <div className="row" style={{ gap: 12 }}>
            <span className="label">{user.name}</span>
            {user.role === "admin" && <span className="pill">Admin</span>}
          </div>
          <div className="topbar-right">
            <span className="pill">Idle</span>
            <Link href="/billing" className="pill num" style={{ color: "var(--ink)" }}>
              {fmtCredits(credits)} credits
            </Link>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
