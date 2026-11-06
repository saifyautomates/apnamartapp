import { adminPageDenied } from "@/lib/admin-page";
import { getBusyPosConfig, getBusyPosMetrics } from "@/lib/busy-pos";
import { PosViewTabs } from "@/components/admin/pos-view-tabs";

export const dynamic = "force-dynamic";

export default async function AdminBusyPosPage() {
  const denied = await adminPageDenied("integrations:read");
  if (denied) return denied;

  const [config, metrics] = await Promise.all([
    getBusyPosConfig(),
    getBusyPosMetrics(),
  ]);

  return <PosViewTabs initialConfig={config} initialMetrics={metrics} />;
}
