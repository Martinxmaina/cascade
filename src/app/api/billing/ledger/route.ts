import { desc, eq } from "drizzle-orm";
import { route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/db";
import { balance } from "@/lib/credits";
import { receiptsForUser, creditsUsedByDay } from "@/lib/usage";

export const GET = route(async () => {
  const user = await requireUser();
  const entries = db
    .select()
    .from(schema.creditLedger)
    .where(eq(schema.creditLedger.userId, user.id))
    .orderBy(desc(schema.creditLedger.createdAt))
    .limit(200)
    .all();
  return {
    balance: balance(user.id),
    entries,
    receipts: receiptsForUser(user.id),
    usage: creditsUsedByDay(user.id),
  };
});
