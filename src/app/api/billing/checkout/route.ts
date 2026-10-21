import { z } from "zod";
import Stripe from "stripe";
import { route, body } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { addCredits, balance } from "@/lib/credits";
import { TOPUP_PACKS } from "@/lib/pricing-defaults";
import { env } from "@/lib/env";

const Input = z.object({ packId: z.enum(TOPUP_PACKS.map((p) => p.id) as [string, ...string[]]) });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { packId } = await body(req, Input);
  const pack = TOPUP_PACKS.find((p) => p.id === packId);
  if (!pack) throw new HttpError(400, "Unknown pack.");

  const key = env.stripeKey();
  if (!key) {
    // Mock top-up for offline use and filming: credits land immediately.
    addCredits(user.id, "topup", pack.credits, { note: `Mock top-up, ${pack.credits} credits` });
    return { mock: true, balance: balance(user.id) };
  }

  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.usd * 100,
          product_data: { name: `${pack.credits.toLocaleString("en-US")} Cascade credits` },
        },
      },
    ],
    metadata: { userId: user.id, credits: String(pack.credits) },
    success_url: `${env.appUrl()}/billing?topup=ok`,
    cancel_url: `${env.appUrl()}/billing`,
  });
  return { url: session.url };
});
