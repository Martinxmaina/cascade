export const env = {
  creditValueUsd: () => Number(process.env.CREDIT_VALUE_USD ?? 0.01),
  defaultMarkup: () => Number(process.env.DEFAULT_MARKUP ?? 4),
  databasePath: () => process.env.DATABASE_PATH ?? "./data/cascade.db",
  stripeKey: () => process.env.STRIPE_SECRET_KEY ?? "",
  appUrl: () => process.env.APP_URL ?? "http://localhost:3000",
};
