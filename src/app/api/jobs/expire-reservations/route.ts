import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin, assertCsrf } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { expireReservations } from "@/lib/inventory";

export const runtime = "nodejs";

/**
 * Cron-safe cleanup: expires ACTIVE reservations past expiry (idempotent).
 * Auth: either a valid admin session (orders:write + CSRF) or the cron secret
 * (CRON_SECRET env, x-cron-secret header) for unattended schedulers.
 * Never public: an unauthenticated call is rejected.
 */
export const POST = handler(async (req: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-cron-secret");
  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    const released = await expireReservations();
    return ok({ released });
  }
  assertCsrf(req);
  const session = await requireAdmin(req);
  requirePermission(session, "orders:write");
  const released = await expireReservations();
  return ok({ released });
});
