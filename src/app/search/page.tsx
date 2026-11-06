import { searchProducts } from "@/lib/search";
import { BlinkitProductCard, VariantCardProps } from "@/components/product";
import { EmptyState } from "@/components/ui";
import Link from "next/link";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const q = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = 24;
  const result = q.trim() ? await searchProducts(q, page, pageSize) : { items: [], total: 0, page: 1, pageSize };
  const pages = Math.max(1, Math.ceil(result.total / pageSize));

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1c]">
            {q ? `Search results for "${q}"` : "Search Groceries"}
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400 font-medium">
            {result.total > 0 ? `Found ${result.total} items delivering in 8 minutes` : "Delivered to your doorstep in 8 minutes"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] text-[#0c831f] border border-[#0c831f]/20 px-3 py-1 text-xs font-black self-start sm:self-auto">
          ⚡ 8 Mins Delivery
        </span>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title="No products found"
          body={
            q
              ? `We couldn't find anything matching "${q}". Try searching for 'milk', 'atta', 'maggi', or 'chips'.`
              : "Type a product, brand or category name above to start searching."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {result.items.map((p) => {
            const v = p.variants[0];
            if (!v) return null;
            const cardData: VariantCardProps = {
              id: v.id,
              name: v.name,
              packSize: v.packSize,
              mrpPaise: v.mrpPaise,
              sellingPaise: v.sellingPaise,
              product: {
                id: p.id,
                name: p.name,
                slug: p.slug,
                brand: p.brand,
                images: p.images,
              },
              inventory: v.inventory,
            };
            return <BlinkitProductCard key={v.id} v={cardData} />;
          })}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex justify-center items-center gap-2 pt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/search?q=${encodeURIComponent(q)}&page=${p}`}
              className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                p === page
                  ? "bg-[#0c831f] text-white shadow-xs"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:border-[#0c831f]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
