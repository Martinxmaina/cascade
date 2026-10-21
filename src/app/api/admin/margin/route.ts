import { route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { marginReport } from "@/lib/usage";

export const GET = route(async (req) => {
  await requireAdmin();
  const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
  return marginReport(Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30);
});
