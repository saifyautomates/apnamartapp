import { prisma } from "@/lib/prisma";
import BlinkitProductCard, { VariantCardProps } from "@/components/product-card";
import { EmptyState } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sub?: string; page?: string; sort?: string };
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: { subcategories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!category) notFound();

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = 24;
  const where: Record<string, unknown> = {
    product: { isActive: true, onlineVisible: true, deletedAt: null, categoryId: category.id },
  };

  if (searchParams.sub) {
    const sub = category.subcategories.find((s) => s.slug === searchParams.sub);
    if (sub) (where.product as Record<string, unknown>).subcategoryId = sub.id;
  }

  const orderBy =
    searchParams.sort === "price_asc"
      ? { sellingPaise: "asc" as const }
      : searchParams.sort === "price_desc"
        ? { sellingPaise: "desc" as const }
        : { createdAt: "desc" as const };

  const [variants, total, allCategories] = await Promise.all([
    prisma.productVariant.findMany({
      where: where as never,
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.productVariant.count({ where: where as never }),
    prisma.category.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Category Banner */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-ink">{category.name}</h1>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {total} items
            </span>
          </div>
          {category.description ? (
            <p className="mt-1 text-xs text-muted font-medium">{category.description}</p>
          ) : (
            <p className="mt-1 text-xs text-muted font-medium">Delivered to your doorstep in 10 minutes</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-extrabold">
            <span className="text-amber-500">⚡</span> Delivery in 10 mins
          </span>
        </div>
      </div>

      {/* Subcategories Filter Chips */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <Link
            href={`/category/${category.slug}`}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
              !searchParams.sub
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-500"
            }`}
          >
            All
          </Link>
          {category.subcategories.map((s) => {
            const isSelected = searchParams.sub === s.slug;
            return (
              <Link
                key={s.id}
                href={`/category/${category.slug}?sub=${s.slug}`}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
                  isSelected
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-500"
                }`}
              >
                {s.name}
              </Link>
            );
          })}
        </div>

        {/* Sort Chips */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="text-slate-400 font-semibold hidden sm:inline">Sort:</span>
          <Link
            href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=price_asc`}
            className={`rounded-xl px-3 py-1.5 border transition ${
              searchParams.sort === "price_asc"
                ? "bg-emerald-50 text-emerald-800 border-emerald-500"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            Price: Low to High
          </Link>
          <Link
            href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=price_desc`}
            className={`rounded-xl px-3 py-1.5 border transition ${
              searchParams.sort === "price_desc"
                ? "bg-emerald-50 text-emerald-800 border-emerald-500"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            Price: High to Low
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      {variants.length === 0 ? (
        <EmptyState
          title="No products found in this category"
          body="Try selecting another subcategory or check back soon."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {variants.map((v) => (
            <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 ? (
        <div className="flex justify-center items-center gap-2 pt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/category/${category.slug}?page=${p}${searchParams.sub ? `&sub=${searchParams.sub}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
              className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                p === page
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-500"
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
