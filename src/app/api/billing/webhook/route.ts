import Stripe from "stripe";
import { addCredits } from "@/lib/credits";
import { env } from "@/lib/env";

// No session: Stripe calls this directly. The signature is the authentication.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = env.stripeKey();
  const sig = req.headers.get("stripe-signature");
  if (!key || !secret || !sig) return Response.json({ error: "Not configured." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = new Stripe(key).webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return Response.json({ error: "Bad signature." }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const userId = s.metadata?.userId;
    const credits = Number(s.metadata?.credits);
    if (userId && credits > 0 && s.payment_status === "paid") {
      addCredits(userId, "topup", credits, { stripeSessionId: s.id, note: "Stripe top-up" });
    }
  }
  return Response.json({ received: true });
}
