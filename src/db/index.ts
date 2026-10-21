import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { DEFAULT_PRICES } from "@/lib/pricing-defaults";

function open() {
  const file = path.resolve(process.env.DATABASE_PATH ?? "./data/cascade.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.resolve("drizzle") });
  for (const p of DEFAULT_PRICES) {
    db.insert(schema.priceList).values(p).onConflictDoNothing().run();
  }
  return db;
}

const g = globalThis as unknown as { __cascadeDb?: ReturnType<typeof open> };
export const db = (g.__cascadeDb ??= open());
export { schema };
