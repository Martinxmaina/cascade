import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/db";
import { balance } from "@/lib/credits";
import { creditsUsedByDay, marginReport, receiptsForUser } from "@/lib/usage";
import { TOPUP_PACKS } from "@/lib/pricing-defaults";
import { env } from "@/lib/env";
import { PageHead } from "@/components/shell/PageHead";
import { BillingView } from "@/components/billing/BillingView";

export default async function Billing() {
  const user = await requireUser();
  const entries = db
    .select()
    .from(schema.creditLedger)
    .where(eq(schema.creditLedger.userId, user.id))
    .orderBy(desc(schema.creditLedger.createdAt))
    .limit(200)
    .all();
  return (
    <>
      <PageHead title="Billing" />
      <BillingView
        balance={balance(user.id)}
        packs={[...TOPUP_PACKS]}
        entries={entries}
        receipts={receiptsForUser(user.id)}
        usage={creditsUsedByDay(user.id)}
        margin={user.role === "admin" ? marginReport(30) : null}
        creditValue={env.creditValueUsd()}
        stripe={Boolean(env.stripeKey())}
      />
    </>
  );
}
