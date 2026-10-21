import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { route, body } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/db";

const Put = z.object({
  website: z.string().trim().max(300).optional(),
  name: z.string().trim().max(120).optional(),
  offer: z.string().trim().max(140).optional(),
  pricePoint: z.string().optional(),
  regions: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  leadTarget: z.number().int().min(10).max(200).optional(),
});

const current = (userId: string) =>
  db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.userId, userId))
    .orderBy(desc(schema.businesses.createdAt))
    .get();

export const GET = route(async () => {
  const user = await requireUser();
  return { business: current(user.id) ?? null };
});

export const PUT = route(async (req) => {
  const user = await requireUser();
  const input = await body(req, Put);
  const existing = current(user.id);
  if (existing) {
    db.update(schema.businesses).set(input).where(eq(schema.businesses.id, existing.id)).run();
  } else {
    db.insert(schema.businesses).values({ userId: user.id, ...input }).run();
  }
  return { business: current(user.id) };
});
