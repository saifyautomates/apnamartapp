import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getBusyPosConfig, getBusyPosMetrics } from "@/lib/busy-pos";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:read");

  const [config, metrics] = await Promise.all([
    getBusyPosConfig(),
    getBusyPosMetrics(),
  ]);

  return ok({
    config,
    metrics,
  });
});
