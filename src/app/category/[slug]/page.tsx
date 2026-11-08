import { prisma, withDbTimeout } from "@/lib/prisma";
import type { Metadata } from "next";
import { BlinkitProductCard, ProductListItem, VariantCardProps } from "@/components/product";
import { EmptyState } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFallbackCategories, getFallbackVariants } from "@/lib/resilient-catalog";
import { CategoryHeaderClient } from "@/components/category/category-header-client";
import { ArrowUpDown, Tag, Check, ChevronDown, Layers, Sparkles } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  let categoryName = "Groceries";
  try {
    const category = await withDbTimeout(
      prisma.category.findUnique({
        where: { slug: params.slug },
        select: { name: true, description: true },
      }),
      250
    );
    if (category?.name) categoryName = category.name;
  } catch {
    const fallbackCats = getFallbackCategories();
    const found = fallbackCats.find((c) => c.slug === params.slug);
    if (found) categoryName = found.name;
  }

  const title = `Buy ${categoryName} Online in Kota | 80 Feet Road Central Mart`;
  const description = `Order fresh packaged ${categoryName} online in Kota, Rajasthan from Central Mart, 80 Feet Road. 100% genuine products, best prices & fast same-day doorstep delivery.`;

  return {
    title,
    description,
    keywords: [
      `${categoryName.toLowerCase()} kota`,
      `buy ${categoryName.toLowerCase()} online kota`,
      `${categoryName.toLowerCase()} delivery 80 feet road kota`,
      `central mart ${categoryName.toLowerCase()}`,
      `grocery delivery kota rajasthan`,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_IN",
      siteName: "Central Mart Kota",
    },
    alternates: {
      canonical: `/category/${params.slug}`,
    },
  };
}

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
    { label: "All Items", slug: "" },
    ...(category.subcategories.length > 0
      ? category.subcategories.map((s) => ({ label: s.name, slug: s.slug }))
      : [
          { label: "Atta & Flours", slug: "atta-flours" },
          { label: "Rice", slug: "rice" },
          { label: "Pulses & Beans", slug: "pulses-beans" },
          { label: "Sugar & Salt", slug: "sugar-salt" },
          { label: "Grains & More", slug: "grains" },
        ]),
  ];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Buy ${category.name} Online in Kota | 80 Feet Road Central Mart`,
    description: `Order authentic ${category.name} online from Central Mart 80 Feet Road Kota with same-day doorstep delivery.`,
    url: `${baseUrl}/category/${category.slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: category.name, item: `${baseUrl}/category/${category.slug}` },
      ],
    },
  };

  return (
    <div className="space-y-4 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
      {/* Mobile Sticky Green Category Header */}
      <CategoryHeaderClient categoryName={category.name} />

      {/* Subcategories Horizontal Icon Rail */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-touch-x">
        {subcategoryPills.map((sub) => {
          const isSelected = !searchParams.sub ? sub.slug === "" : searchParams.sub === sub.slug;
          return (
            <Link
              key={sub.label}
              href={sub.slug ? `/category/${category.slug}?sub=${sub.slug}` : `/category/${category.slug}`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 whitespace-nowrap ${
                isSelected
                  ? "bg-[#0c831f] text-white shadow-xs"
                  : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300"
              }`}
            >
              {sub.slug === "" ? (
                <Layers className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-neutral-500"}`} />
              ) : (
                <Sparkles className={`w-3 h-3 ${isSelected ? "text-white" : "text-neutral-400"}`} />
              )}
              <span>{sub.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Filter & Sort Chips Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold scroll-touch-x">
        <Link
          href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=popular`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0"
        >
          <ArrowUpDown className="w-3 h-3 text-neutral-500" />
          <span>Sort: Popular</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </Link>

        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0">
          <Tag className="w-3 h-3 text-neutral-500" />
          <span>Brand</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </button>

        <Link
          href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=price_asc`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0"
        >
          <span>Price</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </Link>

        <Link
          href={`/category/${category.slug}${searchParams.sub ? `?sub=${searchParams.sub}&` : "?"}sort=offers`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 shrink-0"
        >
          <Check className="w-3 h-3 text-[#0c831f] stroke-[2.5]" />
          <span>Offers</span>
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
