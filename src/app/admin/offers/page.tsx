import { adminPageDenied } from "@/lib/admin-page";
import { getAllStoreOffers } from "@/lib/offers";
import { AdminOffersClient } from "@/components/admin/offers-client";

export default async function AdminOffersPage() {
  const denied = await adminPageDenied("offers:write");
  if (denied) return denied;

  const initialOffers = await getAllStoreOffers();

  return <AdminOffersClient initialOffers={initialOffers} />;
}
