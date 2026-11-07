import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/http";
import { getAllSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (_req: NextRequest) => {
  let s: Record<string, unknown> = {};
  let zones: unknown[] = [];

  try {
    s = (await getAllSettings()) as Record<string, unknown>;
  } catch {
    /* fallback */
  }

  try {
    zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      include: { slots: { where: { isActive: true }, orderBy: { startTime: "asc" } } },
      orderBy: { name: "asc" },
    });
  } catch {
    /* fallback */
  }

  const defaultStore = {
    name: "Central Mart",
    phone: "+91 98765 43210",
    address: "R K Nagar, Police Line, Kota, Rajasthan 324005",
    currency: "INR",
  };

  const defaultDelivery = {
    minOrderPaise: 9900,
    freeDeliveryThresholdPaise: 19900,
    defaultDeliveryFeePaise: 2500,
    deliveryMode: "same_day",
    deliveryBadgeText: "⚡ Same Day Delivery",
  };

  return ok({
    store: s.store ?? defaultStore,
    payments: s.payments ?? { codEnabled: true, upiEnabled: true, cardsEnabled: true },
    delivery: s.delivery ?? defaultDelivery,
    zoneDeliveryRules: s.zoneDeliveryRules ?? {},
    pickup: s.pickup ?? {},
    zones,
  });
});
