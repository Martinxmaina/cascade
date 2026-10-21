import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { env } from "./env";

export type PricingMode = "fixed" | "cost_plus";

function setting(key: string): string | undefined {
  return db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()?.value;
}

export function setSetting(key: string, value: string) {
  db.insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
    .run();
}

export const getPricingMode = (): PricingMode =>
  setting("pricing_mode") === "cost_plus" ? "cost_plus" : "fixed";

export const getMarkup = () => Number(setting("markup") ?? env.defaultMarkup());
export const getCostPlusFloor = () => Number(setting("cost_plus_floor_credits") ?? 0.1);

export const getPriceList = () => db.select().from(schema.priceList).all();

// What the customer pays, in credits, for one result. Fixed mode reads the price list;
// cost-plus is max(floor, Treg cost x markup) converted to credits.
export function customerCredits(resultType: string, tregCostMicro: number): number {
  if (getPricingMode() === "cost_plus") {
    const usd = (tregCostMicro / 1e6) * getMarkup();
    return Math.max(getCostPlusFloor(), Math.round((usd / env.creditValueUsd()) * 1e4) / 1e4);
  }
  const p = db.select().from(schema.priceList).where(eq(schema.priceList.resultType, resultType)).get();
  return p && p.active ? p.credits : 0;
}
