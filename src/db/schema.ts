import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

const id = () => text("id").primaryKey().$defaultFn(() => nanoid());
const createdAt = () =>
  integer("created_at").notNull().$defaultFn(() => Date.now());

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "customer"] }).notNull().default("customer"),
  agreedTermsAt: integer("agreed_terms_at").notNull(),
  createdAt: createdAt(),
});

export const sessions = sqliteTable("sessions", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: createdAt(),
});

export const businesses = sqliteTable("businesses", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  website: text("website"),
  name: text("name"),
  offer: text("offer"),
  pricePoint: text("price_point"),
  regions: text("regions", { mode: "json" }).$type<string[]>().notNull().default([]),
  sizes: text("sizes", { mode: "json" }).$type<string[]>().notNull().default([]),
  leadTarget: integer("lead_target").notNull().default(50),
  brand: text("brand", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: createdAt(),
});

export const pagesRead = sqliteTable("pages_read", {
  id: id(),
  businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  markdown: text("markdown").notNull(),
  tregCallId: text("treg_call_id"),
  createdAt: createdAt(),
});

export const icps = sqliteTable("icps", {
  id: id(),
  businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  json: text("json", { mode: "json" }).$type<unknown>().notNull(),
  note: text("note"),
  approvedAt: integer("approved_at"),
  createdAt: createdAt(),
});

export const runs = sqliteTable(
  "runs",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["find", "clean"] }).notNull(),
    icpId: text("icp_id").references(() => icps.id),
    title: text("title"),
    target: integer("target").notNull().default(0),
    mode: text("mode"),
    status: text("status", { enum: ["queued", "running", "paused", "done", "failed"] })
      .notNull()
      .default("queued"),
    heldCredits: real("held_credits").notNull().default(0),
    chargedCredits: real("charged_credits").notNull().default(0),
    tregCostMicro: integer("treg_cost_micro").notNull().default(0),
    startedAt: integer("started_at"),
    finishedAt: integer("finished_at"),
    createdAt: createdAt(),
  },
  (t) => [index("runs_user_idx").on(t.userId)],
);

export const rows = sqliteTable(
  "rows",
  {
    id: id(),
    runId: text("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    domain: text("domain"),
    logoUrl: text("logo_url"),
    personName: text("person_name"),
    title: text("title"),
    linkedinUrl: text("linkedin_url"),
    email: text("email"),
    emailStatus: text("email_status", {
      enum: ["verified", "catch_all", "invalid", "unknown", "not_found"],
    }),
    emailProvider: text("email_provider"),
    phone: text("phone"),
    phoneProvider: text("phone_provider"),
    companyData: text("company_data", { mode: "json" }).$type<Record<string, unknown>>(),
    extra: text("extra", { mode: "json" }).$type<Record<string, unknown>>(),
    credits: real("credits").notNull().default(0),
    state: text("state").notNull().default("queued"),
    createdAt: createdAt(),
  },
  (t) => [index("rows_run_idx").on(t.runId)],
);

export const providerAttempts = sqliteTable(
  "provider_attempts",
  {
    id: id(),
    rowId: text("row_id").notNull().references(() => rows.id, { onDelete: "cascade" }),
    step: text("step", { enum: ["company", "person", "email", "verify", "phone"] }).notNull(),
    endpointId: text("endpoint_id").notNull(),
    hit: integer("hit").notNull().default(0),
    costMicro: integer("cost_micro").notNull().default(0),
    ms: integer("ms"),
    tregCallId: text("treg_call_id"),
    createdAt: createdAt(),
  },
  (t) => [index("attempts_row_idx").on(t.rowId), index("attempts_endpoint_idx").on(t.endpointId)],
);

// One record per Treg call. userId, runId and step mirror the X-Treg-Meta header,
// so per-customer spend can be summed here and matched against Treg's own records.
export const tregCalls = sqliteTable(
  "treg_calls",
  {
    id: id(),
    endpointId: text("endpoint_id").notNull(),
    paramsHash: text("params_hash"),
    status: integer("status"),
    costMicro: integer("cost_micro").notNull().default(0),
    callId: text("call_id"),
    idempotencyKey: text("idempotency_key"),
    meta: text("meta"),
    userId: text("user_id"),
    runId: text("run_id"),
    step: text("step"),
    createdAt: createdAt(),
  },
  (t) => [
    index("treg_calls_user_idx").on(t.userId),
    index("treg_calls_run_idx").on(t.runId),
    index("treg_calls_day_idx").on(t.createdAt),
  ],
);

export const waterfallOrders = sqliteTable("waterfall_orders", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  step: text("step").notNull(),
  endpointIds: text("endpoint_ids", { mode: "json" }).$type<string[]>().notNull(),
  mode: text("mode", { enum: ["default", "smart", "custom"] }).notNull().default("default"),
  createdAt: createdAt(),
});

// Balance = grant + topup + refund - hold. A charge row records what a run actually
// cost the customer (revenue); it is informational because the hold already deducted it.
export const creditLedger = sqliteTable(
  "credit_ledger",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["grant", "topup", "hold", "charge", "refund"] }).notNull(),
    credits: real("credits").notNull(),
    runId: text("run_id"),
    stripeSessionId: text("stripe_session_id").unique(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("ledger_user_idx").on(t.userId), index("ledger_run_idx").on(t.runId)],
);

export const priceList = sqliteTable("price_list", {
  id: id(),
  resultType: text("result_type").notNull().unique(),
  label: text("label").notNull(),
  credits: real("credits").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const suppressions = sqliteTable("suppressions", {
  id: id(),
  value: text("value").notNull().unique(),
  kind: text("kind", { enum: ["email", "domain"] }).notNull(),
  reason: text("reason"),
  createdAt: createdAt(),
});

export const filterCache = sqliteTable("filter_cache", {
  id: id(),
  provider: text("provider").notNull(),
  filterType: text("filter_type").notNull(),
  values: text("values", { mode: "json" }).$type<unknown>().notNull(),
  fetchedAt: integer("fetched_at").notNull(),
});
