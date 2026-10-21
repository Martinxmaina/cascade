import { z } from "zod";
import { eq } from "drizzle-orm";
import { route, body } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/db";

const Add = z.object({ value: z.string().trim().toLowerCase().min(3), reason: z.string().optional() });

export const GET = route(async () => {
  await requireUser();
  return { suppressions: db.select().from(schema.suppressions).all() };
});

export const POST = route(async (req) => {
  await requireUser();
  const { value, reason } = await body(req, Add);
  const kind = value.includes("@") ? "email" : "domain";
  db.insert(schema.suppressions).values({ value, kind, reason }).onConflictDoNothing().run();
  return { ok: true };
});

export const DELETE = route(async (req) => {
  await requireUser();
  const { value } = await body(req, z.object({ value: z.string().trim().toLowerCase() }));
  db.delete(schema.suppressions).where(eq(schema.suppressions.value, value)).run();
  return { ok: true };
});
