import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { getAllSettings, DEFAULT_DELIVERY_CONFIG, type DeliveryConfig, type ZoneDeliveryRule } from "@/lib/settings";
import { DeliveryManagementClient, type ZoneWithSlots } from "@/components/admin/delivery-management-client";

export const dynamic = "force-dynamic";

const DEFAULT_FALLBACK_ZONES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Central Kota Zone 1",
    pincodes: ["324001", "324002", "324005", "324007"],
    isActive: true,
    slots: [
      { id: "slot-1", startTime: "08:00", endTime: "12:00", maxOrders: 50, isActive: true },
      { id: "slot-2", startTime: "12:00", endTime: "16:00", maxOrders: 50, isActive: true },
      { id: "slot-3", startTime: "16:00", endTime: "20:00", maxOrders: 50, isActive: true },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "South Delhi Hub",
    pincodes: ["110017", "110019", "110024", "110048"],
    isActive: true,
    slots: [
      { id: "slot-4", startTime: "09:00", endTime: "14:00", maxOrders: 40, isActive: true },
      { id: "slot-5", startTime: "14:00", endTime: "20:00", maxOrders: 40, isActive: true },
    ],
  },
];

export default async function AdminDeliveryPage() {
  const denied = await adminPageDenied("delivery:write");
  if (denied) return denied;

  let settings = await getAllSettings().catch(() => ({}));
  let rawZones: any[] = [];

  try {
    rawZones = await withDbTimeout(
      prisma.deliveryZone.findMany({
        include: { slots: { orderBy: { startTime: "asc" } } },
        orderBy: { name: "asc" },
      }),
      250
    );
  } catch {
    /* fallback to default delivery zones */
  }

  if (rawZones.length === 0) {
    rawZones = DEFAULT_FALLBACK_ZONES;
  }

  const deliveryConfig: DeliveryConfig = {
    ...DEFAULT_DELIVERY_CONFIG,
    ...(((settings as Record<string, any>).delivery as Partial<DeliveryConfig>) ?? {}),
  };

  const zoneRules = ((settings as Record<string, any>).zoneDeliveryRules as Record<string, ZoneDeliveryRule>) ?? {};

  return (
    <DeliveryManagementClient
      initialConfig={deliveryConfig}
      initialZones={rawZones as unknown as ZoneWithSlots[]}
      initialZoneRules={zoneRules}
    />
  );
}
