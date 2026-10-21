import { z } from "zod";
import { route, body } from "@/lib/api";
import { verifyLogin, startSession } from "@/lib/auth";

const Input = z.object({ email: z.string().trim().min(1), password: z.string().min(1) });

export const POST = route(async (req) => {
  const { email, password } = await body(req, Input);
  const user = await verifyLogin(email, password);
  if (!user) return Response.json({ error: "Email or password is wrong." }, { status: 401 });
  await startSession(user.id);
  return { ok: true };
});
