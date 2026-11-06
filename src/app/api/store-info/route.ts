import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { getAllSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest) => {
  const s = await getAllSettings();
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    include: { slots: { where: { isActive: true }, orderBy: { startTime: "asc" } } },
    orderBy: { name: "asc" },
  });
  return ok({
    store: s.store ?? {},
    payments: s.payments ?? {},
    delivery: s.delivery ?? {},
    zoneDeliveryRules: s.zoneDeliveryRules ?? {},
    pickup: s.pickup ?? {},
    zones,
  });
});
