import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { getAllSettings, DEFAULT_DELIVERY_CONFIG, type DeliveryConfig, type ZoneDeliveryRule } from "@/lib/settings";
import { DeliveryManagementClient, type ZoneWithSlots } from "@/components/admin/delivery-management-client";

export const dynamic = "force-dynamic";

const DEFAULT_FALLBACK_ZONES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Kota Central & North (Nayapura, Station, Gumanpura, Borkhera)",
    pincodes: ["324001", "324002", "324003", "324009", "324010"],
    isActive: true,
    slots: [
      { id: "slot-1", startTime: "08:00", endTime: "11:30", maxOrders: 100, isActive: true },
      { id: "slot-2", startTime: "12:00", endTime: "15:30", maxOrders: 100, isActive: true },
      { id: "slot-3", startTime: "16:30", endTime: "20:30", maxOrders: 150, isActive: true },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Kota South & Coaching Hub (Talwandi, Vigyan Nagar, Dadabari, Mahaveer Nagar)",
    pincodes: ["324004", "324005", "324006"],
    isActive: true,
    slots: [
      { id: "slot-4", startTime: "08:00", endTime: "11:30", maxOrders: 100, isActive: true },
      { id: "slot-5", startTime: "12:00", endTime: "15:30", maxOrders: 100, isActive: true },
      { id: "slot-6", startTime: "16:30", endTime: "20:30", maxOrders: 150, isActive: true },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Kota Kunhari & Outer (Kunhari, Landmark City, Sakatpura, Anantpura)",
    pincodes: ["324007", "324008"],
    isActive: true,
    slots: [
      { id: "slot-7", startTime: "08:00", endTime: "11:30", maxOrders: 80, isActive: true },
      { id: "slot-8", startTime: "12:00", endTime: "15:30", maxOrders: 80, isActive: true },
      { id: "slot-9", startTime: "16:30", endTime: "20:30", maxOrders: 100, isActive: true },
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
