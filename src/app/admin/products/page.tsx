import { adminPageDenied } from "@/lib/admin-page";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { ProductForm } from "@/components/admin-ui";
import { AdminCard, AdminPageHeader } from "@/components/admin-display";
import Link from "next/link";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const denied = await adminPageDenied("products:read");
  if (denied) return denied;

  const q = searchParams.q ?? "";
  const selectedCat = searchParams.category ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = 40;

  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (selectedCat) {
    where.categoryId = selectedCat;
  }

  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      include: { category: true, brand: true, variants: { include: { inventory: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where: where as never }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminPageHeader
          title="FMCG Products Management"
          subtitle={`Managing ${totalCount.toLocaleString()} products across ${categories.length} FMCG departments.`}
        />
        <div className="flex items-center gap-2">
          <Link
            href="/admin/bulk"
            className="flex items-center gap-1.5 rounded-full bg-[#0c831f] hover:bg-[#0a701a] px-4 py-2 text-xs font-black text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span>⚡</span>
            <span>FMCG 5,000 Scale Tool</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <form method="get" className="flex flex-wrap items-center gap-2.5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search product name, SKU, brand, barcode…"
          className="w-full sm:w-80 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-[#0c831f]"
        />

        <select
          name="category"
          defaultValue={selectedCat}
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0c831f]"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-5 py-2 text-sm font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
        >
          Filter
        </button>

        {q || selectedCat ? (
          <Link
            href="/admin/products"
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition"
          >
            Clear Filters
          </Link>
        ) : null}
      </form>

      {/* Catalogue Table */}
      <AdminCard
        title={`Catalogue (${startItem}-${endItem} of ${totalCount.toLocaleString()} items)`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-neutral-400 text-xs font-black uppercase tracking-wider border-b border-neutral-100 pb-2">
                <th className="py-2.5">Product &amp; Pack</th>
                <th>Brand</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Sellable / Available</th>
                <th>Online</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) =>
                p.variants.map((v) => {
                  const sellable = v.inventory ? v.inventory.availableQty - v.inventory.reservedQty : 0;
                  const available = v.inventory?.availableQty ?? 0;
                  return (
                    <tr key={v.id} className="hover:bg-neutral-50/60 transition">
                      <td className="py-3 font-semibold text-[#1c1c1c]">
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          <span className="text-xs text-neutral-500 font-medium">{v.packSize ?? v.name}</span>
                        </div>
                      </td>
                      <td className="text-neutral-600 font-medium">{p.brand?.name ?? "—"}</td>
                      <td className="text-neutral-600 font-medium">{p.category.name}</td>
                      <td className="font-mono text-xs text-neutral-500">{v.sku}</td>
                      <td className="font-bold text-[#1c1c1c]">{formatPaise(v.sellingPaise)}</td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black ${
                            sellable > 10
                              ? "bg-emerald-50 text-emerald-700"
                              : sellable > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {sellable} / {available}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black ${
                            p.onlineVisible && p.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {p.onlineVisible && p.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>

          {products.length === 0 ? (
            <div className="py-8 text-center text-neutral-400">
              <p className="font-bold">No products found matching your filter.</p>
              <p className="text-xs mt-1">Try clearing filters or scaling catalogue via the FMCG 5,000 tool.</p>
            </div>
          ) : null}
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 ? (
          <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs font-bold text-neutral-600">
            <span>
              Page {page} of {totalPages} ({totalCount} total products)
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/admin/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(selectedCat)}&page=${page - 1}`}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-50 transition"
                >
                  ← Previous
                </Link>
              ) : null}

              {page < totalPages ? (
                <Link
                  href={`/admin/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(selectedCat)}&page=${page + 1}`}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-50 transition"
                >
                  Next →
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </AdminCard>

      {/* Add Single Product Form */}
      <AdminCard title="Add Individual Product">
        <ProductForm />
      </AdminCard>
    </div>
  );
}
