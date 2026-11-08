import { prisma, withDbTimeout } from "@/lib/prisma";
import { BlinkitProductCard, ProductListItem, VariantCardProps } from "@/components/product";
import { EmptyState } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFallbackCategories, getFallbackVariants } from "@/lib/resilient-catalog";
import { CategoryHeaderClient } from "@/components/category/category-header-client";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sub?: string; page?: string; sort?: string };
}) {
  let category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    subcategories: Array<{ id: string; name: string; slug: string }>;
  } | null = null;

  try {
    category = await withDbTimeout(
      prisma.category.findUnique({
        where: { slug: params.slug },
        include: { subcategories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
      }),
      250
    );
  } catch {
    /* fallback to resilient catalog */
  }

  if (!category) {
    const fallbackCats = getFallbackCategories();
    category = fallbackCats.find((c) => c.slug === params.slug) ?? null;
  }

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

  let variants: VariantCardProps[] = [];
  let total = 0;

  try {
    const [dbVariants, dbTotal] = await withDbTimeout(
      Promise.all([
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
      ]),
      250
    );
    variants = dbVariants as unknown as VariantCardProps[];
    total = dbTotal;
  } catch {
    /* fallback */
  }

  if (variants.length === 0) {
    variants = getFallbackVariants([params.slug], pageSize);
    total = variants.length;
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  // Category Subcategory Pills
  const subcategoryPills = [
    { label: "All", slug: "", icon: "🌾" },
    ...(category.subcategories.length > 0
      ? category.subcategories.map((s) => ({ label: s.name, slug: s.slug, icon: "🥣" }))
      : [
          { label: "Atta & Flours", slug: "atta-flours", icon: "🍚" },
          { label: "Rice", slug: "rice", icon: "🍚" },
          { label: "Pulses & Beans", slug: "pulses-beans", icon: "🫘" },
          { label: "Sugar & Salt", slug: "sugar-salt", icon: "🧂" },
          { label: "Grains & More", slug: "grains", icon: "🌾" },
        ]),
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Mobile Sticky Green Category Header (Matches Phone 2 Mockup) */}
      <CategoryHeaderClient categoryName={category.name} />

      {/* Subcategories Horizontal Icon Rail (Matches Phone 2 Mockup) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-touch-x">
        {subcategoryPills.map((sub) => {
          const isSelected = !searchParams.sub ? sub.slug === "" : searchParams.sub === sub.slug;
          return (
            <Link
              key={sub.label}
              href={sub.slug ? `/category/${category.slug}?sub=${sub.slug}` : `/category/${category.slug}`}
              className={`flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] p-2 rounded-2xl border transition active:scale-95 ${
                isSelected
                  ? "bg-[#e8f5e9] border-[#0c831f] text-[#0c831f] font-black shadow-xs"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 font-semibold"
              }`}
            >
              <span className="text-xl sm:text-2xl mb-1">{sub.icon}</span>
              <span className="text-[10px] sm:text-xs leading-tight text-center">{sub.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Filter & Sort Chips Row (Matches Phone 2 Mockup) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-bold scroll-touch-x">
        <Link
          href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=popular`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0"
        >
          <span>⇅ Sort: Popular</span>
          <span className="text-[10px] text-neutral-400">▾</span>
        </Link>

        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0">
          <span>🏷️ Brand</span>
          <span className="text-[10px] text-neutral-400">▾</span>
        </button>

        <Link
          href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=price_asc`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0"
        >
          <span>₹ Price</span>
          <span className="text-[10px] text-neutral-400">▾</span>
        </Link>

        <Link
          href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=offers`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0"
        >
          <span>✓ Offers</span>
        </Link>
      </div>

      {/* Products Listing: List View on Mobile (Matches Phone 2 Mockup) & Grid on Desktop */}
      {variants.length === 0 ? (
        <EmptyState
          title="No products found in this category"
          body="Try selecting another subcategory or check back soon."
        />
      ) : (
        <>
          {/* Mobile Phone 2 List View */}
          <div className="flex sm:hidden flex-col gap-2.5">
            {variants.map((v) => (
              <ProductListItem key={v.id} v={v as unknown as VariantCardProps} />
            ))}
          </div>

          {/* Desktop Grid View */}
          <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {variants.map((v) => (
              <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
            ))}
          </div>
        </>
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
