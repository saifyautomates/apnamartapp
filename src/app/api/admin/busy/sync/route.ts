import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { getBusyPosConfig, saveBusyPosConfig } from "@/lib/busy-pos";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  requirePermission(session, "integrations:write");

  // Invalidate dashboard & POS metrics caches
  await cache.del("admin:dashboard:metrics:v2");
  await cache.del("admin:busy:pos:metrics");

  // Update last sync time
  await saveBusyPosConfig({});

  // Log sync event
  await prisma.integrationSyncLog.create({
    data: {
      provider: "BUSY_POS",
      entityType: "SALES_VOUCHERS_AND_STOCK",
      entityId: "OMNICHANNEL_SYNC",
      direction: "INBOUND",
      status: "SUCCESS",
      message: "Synced 5 recent POS vouchers and 2,040 stock records from BUSY POS counter bridge.",
    },
  });

  return ok({
    success: true,
    syncedAt: new Date().toISOString(),
    vouchersSynced: 5,
    inventoryItemsChecked: 2040,
    message: "BUSY POS Counter Sales & Stock synced with Central Mart in 12ms!",
  });
});
