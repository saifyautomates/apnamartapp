import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getBusyStatus } from "@/lib/busy";
import { getShiprocketStatus } from "@/lib/shiprocket";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:read");
  const jobs = await prisma.integrationSyncJob.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { logs: { orderBy: { createdAt: "desc" }, take: 3 } } });
  const settings = await prisma.setting.findUnique({ where: { key: "busy" } });
  const busyCfg = (settings?.value as { postingTrigger?: string } | undefined) ?? {};
  return ok({
    integrations: [
      { name: "BUSY Enterprise", ...getBusyStatus(), description: "Sync products, inventory, customers, invoices and accounting.", postingTrigger: busyCfg.postingTrigger ?? "OUT_FOR_DELIVERY" },
      { name: "Shiprocket", ...getShiprocketStatus(), description: "Shipping and courier fulfilment (future)." },
      { name: "Payment Gateway", connected: false, provider: "Gateway", reason: "Mock gateway in v1; wire a real provider via env." },
      { name: "SMS Provider", connected: false, provider: "SMS", reason: "Console provider in v1." },
      { name: "WhatsApp", connected: false, provider: "WhatsApp", reason: "Console provider in v1." },
    ],
    jobs,
  });
});
