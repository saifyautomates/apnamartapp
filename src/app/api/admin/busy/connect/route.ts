import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { saveBusyPosConfig, getBusyPosConfig } from "@/lib/busy-pos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:write");

  const body = await req.json().catch(() => ({}));
  const { enabled, bridgeUrl, companyCode, financialYear, apiKey, autoSync } = body;

  const current = await getBusyPosConfig();
  const updated = await saveBusyPosConfig({
    enabled: typeof enabled === "boolean" ? enabled : current.enabled,
    bridgeUrl: typeof bridgeUrl === "string" ? bridgeUrl : current.bridgeUrl,
    companyCode: typeof companyCode === "string" ? companyCode : current.companyCode,
    financialYear: typeof financialYear === "string" ? financialYear : current.financialYear,
    apiKey: typeof apiKey === "string" ? apiKey : current.apiKey,
    autoSync: typeof autoSync === "boolean" ? autoSync : current.autoSync,
  });

  // Create audit log safely
  try {
    await prisma.auditLog.create({
      data: {
        action: updated.enabled ? "BUSY_POS_ATTACHED" : "BUSY_POS_DETACHED",
        actorType: "ADMIN",
        entityType: "Integration",
        entityId: "BUSY_POS",
        actorId: session.adminId,
        after: {
          bridgeUrl: updated.bridgeUrl,
          companyCode: updated.companyCode,
          enabled: updated.enabled,
        },
      },
    });
  } catch {
    /* ignore fallback */
  }

  return ok({
    success: true,
    config: updated,
    message: updated.enabled
      ? "BUSY POS bridge connected successfully! Real-time counter sales are now active."
      : "BUSY POS bridge disconnected.",
  });
});
