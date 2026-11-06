import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";

export default async function AdminOffersPage() {
  const denied = await adminPageDenied("offers:write");
  if (denied) return denied;
  const offers = await prisma.offer.findMany({ include: { products: { include: { product: true } }, categories: { include: { category: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Offers</h1>
      <p className="mt-1 text-sm text-muted">Offers are informational badges in v1; discounts at checkout are applied via coupons and the pricing engine.</p>
      <div className="mt-4 space-y-3">
        {offers.map((o) => (
          <article key={o.id} className="rounded-lg border border-line bg-white p-4">
            <p className="font-bold">{o.title}</p>
            <p className="text-sm text-muted">{o.description ?? ""}</p>
            <p className="text-sm">{o.type} {o.value}{o.type === "PERCENT" ? "%" : " paise"} · {o.isActive ? "Active" : "Inactive"}</p>
            {o.products.length > 0 ? <p className="text-sm text-muted">Products: {o.products.map((p) => p.product.name).join(", ")}</p> : null}
            {o.categories.length > 0 ? <p className="text-sm text-muted">Categories: {o.categories.map((c) => c.category.name).join(", ")}</p> : null}
          </article>
        ))}
        {offers.length === 0 ? <p className="text-muted">No offers yet. Create one via the API or seed data.</p> : null}
      </div>
    </div>
  );
}
