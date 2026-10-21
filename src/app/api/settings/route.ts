import { z } from "zod";
import { eq } from "drizzle-orm";
import { route, body } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db, schema } from "@/db";
import { getPriceList, getPricingMode, getMarkup, getCostPlusFloor, setSetting } from "@/lib/pricing";

export const GET = route(async () => {
  await requireUser();
  return {
    prices: getPriceList(),
    mode: getPricingMode(),
    markup: getMarkup(),
    floor: getCostPlusFloor(),
  };
});

const Put = z.object({
  mode: z.enum(["fixed", "cost_plus"]).optional(),
  markup: z.number().min(1).max(100).optional(),
  floor: z.number().min(0).max(1000).optional(),
  prices: z.array(z.object({ resultType: z.string(), credits: z.number().min(0), active: z.boolean() })).optional(),
});

export const PUT = route(async (req) => {
  await requireAdmin();
  const input = await body(req, Put);
  if (input.mode) setSetting("pricing_mode", input.mode);
  if (input.markup !== undefined) setSetting("markup", String(input.markup));
  if (input.floor !== undefined) setSetting("cost_plus_floor_credits", String(input.floor));
  for (const p of input.prices ?? []) {
    db.update(schema.priceList)
      .set({ credits: p.credits, active: p.active })
      .where(eq(schema.priceList.resultType, p.resultType))
      .run();
  }
  return { ok: true };
});
