import { adminPageDenied } from "@/lib/admin-page";
import { getAllSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin-ui";
import { AdminPageHeader } from "@/components/admin-display";

export default async function AdminSettingsPage() {
  const denied = await adminPageDenied("settings:write");
  if (denied) return denied;
  const settings = await getAllSettings();
  return (
    <div>
      <AdminPageHeader title="Settings" subtitle="No business values are hardcoded — these settings drive the storefront, checkout and BUSY posting trigger." />
      <SettingsForm initial={settings} />
    </div>
  );
}
