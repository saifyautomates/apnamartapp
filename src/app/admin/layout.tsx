import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccess } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import AdminShell from "@/components/admin-shell";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/delivery", label: "Delivery" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/loyalty", label: "Loyalty" },
  { href: "/admin/credit", label: "Store Credit" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/users", label: "Users & Roles" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit", label: "Audit Logs" },
  { href: "/admin/bulk", label: "Bulk Import" },
];

function monogramFor(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AG";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get("gcp_access")?.value;
  let ok = false;
  if (token) {
    try {
      const s = verifyAccess(token);
      ok = s.kind === "ADMIN";
    } catch {
      ok = false;
    }
  }
  if (!ok) redirect("/staff-login");
  let storeName = "Central Mart";
  try {
    const settings = await getAllSettings();
    const store = settings.store as { name?: string } | undefined;
    if (store?.name) storeName = store.name;
  } catch {
    /* settings table may not exist yet on first boot — fall back to the default name */
  }
  return (
    <AdminShell nav={NAV} storeName={storeName} monogram={monogramFor(storeName)}>
      {children}
    </AdminShell>
  );
}
