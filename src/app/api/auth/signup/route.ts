import { z } from "zod";
import { route, body } from "@/lib/api";
import { createUser, startSession } from "@/lib/auth";
import { addCredits } from "@/lib/credits";
import { SIGNUP_GRANT_CREDITS } from "@/lib/pricing-defaults";

const Input = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(10, "Use at least 10 characters."),
  agreed: z.literal(true, { error: "Agree to the outreach terms to continue." }),
});

export const POST = route(async (req) => {
  const input = await body(req, Input);
  const res = await createUser(input);
  if ("error" in res) return Response.json({ error: res.error }, { status: 409 });
  addCredits(res.user.id, "grant", SIGNUP_GRANT_CREDITS, { note: "Sign-up credits" });
  await startSession(res.user.id);
  return { ok: true };
});
