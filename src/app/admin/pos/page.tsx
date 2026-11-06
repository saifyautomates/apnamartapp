import { adminPageDenied } from "@/lib/admin-page";
import { getBusyPosConfig, getBusyPosMetrics } from "@/lib/busy-pos";
import { BusyPosTerminal } from "@/components/admin/busy-pos-terminal";

export const dynamic = "force-dynamic";

export default async function AdminBusyPosPage() {
  const denied = await adminPageDenied("integrations:read");
  if (denied) return denied;

  const [config, metrics] = await Promise.all([
    getBusyPosConfig(),
    getBusyPosMetrics(),
  ]);

  return <BusyPosTerminal initialConfig={config} initialMetrics={metrics} />;
}
