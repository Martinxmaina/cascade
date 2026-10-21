import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/db";
import { balance } from "@/lib/credits";
import { fmtCredits, fmtDate } from "@/lib/format";
import { PageHead } from "@/components/shell/PageHead";
import { EmptyState } from "@/components/shell/EmptyState";

export default async function Home() {
  const user = await requireUser();
  const runs = db
    .select()
    .from(schema.runs)
    .where(eq(schema.runs.userId, user.id))
    .orderBy(desc(schema.runs.createdAt))
    .limit(10)
    .all();
  const kpis = [
    { label: "Credits balance", value: fmtCredits(balance(user.id)) },
    { label: "Leads found this week", value: "0" },
    { label: "Verified rate", value: "None yet" },
    { label: "Average cost per verified email", value: "None yet" },
    { label: "Savings vs best single provider", value: "None yet" },
  ];
  return (
    <>
      <PageHead title={`Hi ${user.name.split(" ")[0]}`} />
      <div className="grid-kpi" style={{ marginBottom: 32 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <span className="label">{k.label}</span>
            <span className="big-num" style={k.value === "None yet" ? { fontSize: 20, color: "var(--ink-label)" } : undefined}>
              {k.value}
            </span>
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom: 12 }}>Recent runs</h3>
      {runs.length === 0 ? (
        <EmptyState
          title="No runs yet"
          line="Describe your business and Cascade finds the people who buy it."
          action={<Link className="btn" href="/onboarding">New ICP</Link>}
        />
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead><tr><th>Run</th><th>Status</th><th className="r">Credits</th><th>Started</th></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/leads/${r.id}`}>{r.title ?? r.kind}</Link></td>
                  <td>{r.status}</td>
                  <td className="r num">{fmtCredits(r.chargedCredits)}</td>
                  <td className="muted">{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
