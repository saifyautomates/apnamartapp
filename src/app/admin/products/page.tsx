import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { ProductForm } from "@/components/admin-ui";
import { AdminCard, AdminPageHeader } from "@/components/admin-display";
import Link from "next/link";

export default async function AdminProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const denied = await adminPageDenied("products:read");
  if (denied) return denied;
  const q = searchParams.q ?? "";
  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
    ];
  }
  const products = await prisma.product.findMany({
    where: where as never,
    include: { category: true, brand: true, variants: { include: { inventory: true } } },
    orderBy: { name: "asc" },
    take: 100,
  });
  return (
    <div>
      <AdminPageHeader title="Products" subtitle="Search by name, SKU or barcode. Stock shows sellable / available." />
      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU, barcode…"
          className="w-full max-w-md flex-1 rounded-full border border-adminline bg-white px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-admin"
        />
        <button className="rounded-full bg-admin px-5 py-2 text-sm font-semibold text-white">Search</button>
        <Link href="/admin/bulk" className="rounded-full border border-adminline bg-white px-4 py-2 text-sm font-semibold">
          Bulk import
        </Link>
      </form>
      <AdminCard className="mt-4" title="Catalogue">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2">Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visible</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) =>
                p.variants.map((v) => (
                  <tr key={v.id} className="border-t border-adminline">
                    <td className="py-2.5 font-medium">
                      {p.name} ({v.packSize ?? v.name})
                    </td>
                    <td>{v.sku}</td>
                    <td>{p.category.name}</td>
                    <td>{formatPaise(v.sellingPaise)}</td>
                    <td>
                      {v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0} / {v.inventory?.availableQty ?? 0}
                    </td>
                    <td>{p.onlineVisible && p.isActive ? "Yes" : "No"}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          {products.length === 0 ? <p className="py-4 text-muted">No products found.</p> : null}
        </div>
      </AdminCard>
      <AdminCard className="mt-6" title="Add product">
        <ProductForm />
      </AdminCard>
    </div>
  );
}
