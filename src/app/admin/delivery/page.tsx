import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { getAllSettings, DEFAULT_DELIVERY_CONFIG, type DeliveryConfig, type ZoneDeliveryRule } from "@/lib/settings";
import { DeliveryManagementClient, type ZoneWithSlots } from "@/components/admin/delivery-management-client";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const denied = await adminPageDenied("delivery:write");
  if (denied) return denied;

  const [settings, rawZones] = await Promise.all([
    getAllSettings(),
    prisma.deliveryZone.findMany({
      include: { slots: { orderBy: { startTime: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const deliveryConfig: DeliveryConfig = {
    ...DEFAULT_DELIVERY_CONFIG,
    ...((settings.delivery as Partial<DeliveryConfig>) ?? {}),
  };

  const zoneRules = (settings.zoneDeliveryRules as Record<string, ZoneDeliveryRule>) ?? {};

  return (
    <DeliveryManagementClient
      initialConfig={deliveryConfig}
      initialZones={rawZones as unknown as ZoneWithSlots[]}
      initialZoneRules={zoneRules}
    />
  );
}
