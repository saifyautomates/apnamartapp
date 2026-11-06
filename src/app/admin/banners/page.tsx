import { adminPageDenied } from "@/lib/admin-page";
import { getAllStoreBanners } from "@/lib/banners";
import { BannersClient } from "@/components/admin/banners-client";

export default async function AdminBannersPage() {
  const denied = await adminPageDenied("offers:write");
  if (denied) return denied;

  const banners = await getAllStoreBanners();

  return <BannersClient initialBanners={banners} />;
}
