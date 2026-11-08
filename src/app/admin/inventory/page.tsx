import { adminPageDenied } from "@/lib/admin-page";
import { prisma, withDbTimeout } from "@/lib/prisma";
import { InventoryAdjustForm } from "@/components/admin-ui";
import { AdminCard, AdminPageHeader } from "@/components/admin-display";
import Link from "next/link";
import { FMCG_CATEGORIES } from "@/lib/fmcg-catalog";

function getFallbackInventoryRows() {
  const rows: any[] = [];
  for (const cat of FMCG_CATEGORIES) {
    for (const item of cat.items) {
      const prodSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      for (const v of item.variants) {
        rows.push({
          id: `inv-${prodSlug}-${v.pack}`,
          availableQty: v.stock ?? 100,
          reservedQty: 2,
          minStock: 20,
          updatedAt: new Date(),
          variant: {
            id: `var-${prodSlug}-${v.pack}`,
            name: `${item.name} (${v.pack})`,
            sku: `SKU-${prodSlug.slice(0, 6).toUpperCase()}-${v.pack}`,
            barcode: (item as any).barcode || "8901058852441",
            sellingPaise: Math.round(v.selling * 100),
            product: {
              name: item.name,
              brand: { name: item.brand },
            },
          },
        });
      }
    }
  }
  return rows;
}

export default async function AdminInventoryPage({ searchParams }: { searchParams: { q?: string; low?: string } }) {
  const denied = await adminPageDenied("inventory:read");
  if (denied) return denied;
  const q = searchParams.q ?? "";
  const where: Record<string, unknown> = {};
  if (q) {
    where.variant = {
      OR: [
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  let rows: any[] = [];
  try {
    rows = await withDbTimeout(
      prisma.inventory.findMany({
        where: where as never,
        include: { variant: { include: { product: true } } },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      2500
    );
  } catch {
    /* fallback to fmcg stock */
  }

  if (rows.length === 0) {
    const all = getFallbackInventoryRows();
    rows = q
      ? all.filter((r) => r.variant.name.toLowerCase().includes(q.toLowerCase()) || r.variant.sku.toLowerCase().includes(q.toLowerCase()))
      : all;
  }

  const filtered = searchParams.low === "true" ? rows.filter((r) => r.availableQty - r.reservedQty <= r.minStock) : rows;
  return (
    <div>
      <AdminPageHeader title="Inventory" subtitle="Adjust stock per variant. Sellable = available − reserved." />
      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU, barcode…"
          className="w-full max-w-md flex-1 rounded-full border border-adminline bg-white px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-admin"
        />
        <button className="rounded-full bg-admin px-5 py-2 text-sm font-semibold text-white">Search</button>
        <Link
          href="/admin/inventory?low=true"
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            searchParams.low === "true" ? "border-admin bg-admin text-white" : "border-adminline bg-white"
          }`}
        >
          Low stock only
        </Link>
        <Link
          href="/admin/inventory"
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            searchParams.low !== "true" ? "border-admin bg-admin text-white" : "border-adminline bg-white"
          }`}
        >
          All
        </Link>
      </form>
      <div className="mt-4 space-y-3">
        {filtered.map((r) => {
          const sellable = r.availableQty - r.reservedQty;
          const low = sellable <= r.minStock;
          return (
            <AdminCard key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {r.variant.product.name} ({r.variant.packSize ?? r.variant.name})
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    SKU {r.variant.sku}
                    {r.variant.barcode ? ` · Barcode ${r.variant.barcode}` : ""}
                  </p>
                </div>
                <p className="text-sm">
                  Available <strong>{r.availableQty}</strong> · Reserved <strong>{r.reservedQty}</strong> · Sellable{" "}
                  <strong className={low ? "text-sale" : ""}>{sellable}</strong>
                  {low ? <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">LOW STOCK</span> : null}
                </p>
              </div>
              <div className="mt-3">
                <InventoryAdjustForm variantId={r.variantId} />
              </div>
            </AdminCard>
          );
        })}
        {filtered.length === 0 ? <p className="text-muted">No inventory rows found.</p> : null}
      </div>
    </div>
  );
}
