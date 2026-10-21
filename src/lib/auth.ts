import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq, and, gt, count } from "drizzle-orm";
import { db, schema } from "@/db";

const COOKIE = "cascade_session";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (t: string) =>
  crypto
    .createHmac("sha256", process.env.SESSION_SECRET ?? "dev-secret")
    .update(t)
    .digest("hex");

export type SessionUser = typeof schema.users.$inferSelect;

export async function createUser(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (existing) return { error: "An account with this email already exists." } as const;
  const [{ n }] = db.select({ n: count() }).from(schema.users).all();
  const user = db
    .insert(schema.users)
    .values({
      email,
      name: input.name.trim(),
      passwordHash: await bcrypt.hash(input.password, 12),
      role: n === 0 ? "admin" : "customer",
      agreedTermsAt: Date.now(),
    })
    .returning()
    .get();
  return { user } as const;
}

export async function verifyLogin(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  // Compare against a dummy hash when the user is missing so timing doesn't reveal accounts.
  const hash = user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi";
  const ok = await bcrypt.compare(password, hash);
  return ok && user ? user : null;
}

export async function startSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + THIRTY_DAYS;
  db.insert(schema.sessions).values({ userId, tokenHash: hashToken(token), expiresAt }).run();
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hashToken(token))).run();
  jar.delete(COOKIE);
}

export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, hashToken(token)), gt(schema.sessions.expiresAt, Date.now())))
    .get();
  return row?.user ?? null;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new HttpError(401, "Sign in required.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Admin only.");
  return user;
}
