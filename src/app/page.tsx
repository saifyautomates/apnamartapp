import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui";
import { ProductImage } from "@/components/shop";
import BlinkitProductCard, { VariantCardProps } from "@/components/product-card";
import Link from "next/link";

export default async function HomePage() {
  const [categories, popular, deals, dairyItems, snackItems, stapleItems, brands] = await Promise.all([
    // Categories
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),

    // Popular items
    prisma.productVariant.findMany({
      where: { product: { isActive: true, onlineVisible: true, deletedAt: null } },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Deals with discounts
    prisma.productVariant.findMany({
      where: {
        product: { isActive: true, onlineVisible: true, deletedAt: null },
      },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      take: 40,
    }),

    // Dairy & Eggs
    prisma.productVariant.findMany({
      where: {
        product: {
          category: { slug: "dairy-eggs" },
          isActive: true,
          onlineVisible: true,
          deletedAt: null,
        },
      },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      take: 6,
    }),

    // Snacks & Munchies
    prisma.productVariant.findMany({
      where: {
        product: {
          category: { slug: "snacks" },
          isActive: true,
          onlineVisible: true,
          deletedAt: null,
        },
      },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      take: 6,
    }),

    // Staples (Atta, Rice, Dal)
    prisma.productVariant.findMany({
      where: {
        product: {
          category: { slug: "staples" },
          isActive: true,
          onlineVisible: true,
          deletedAt: null,
        },
      },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      take: 6,
    }),

    // Brands
    prisma.brand.findMany({ orderBy: { name: "asc" }, take: 16 }),
  ]);

  const discountDeals = deals.filter((v) => v.sellingPaise < v.mrpPaise).slice(0, 6);

  const categoryVisuals: Record<string, { icon: string; bg: string; img: string }> = {
    "dairy-eggs": { icon: "🥛", bg: "bg-blue-50 text-blue-900 border-blue-100", img: "/images/categories/dairy-eggs.jpg" },
    "staples": { icon: "🌾", bg: "bg-amber-50 text-amber-900 border-amber-100", img: "/images/categories/staples.jpg" },
    "snacks": { icon: "🍿", bg: "bg-yellow-50 text-yellow-900 border-yellow-100", img: "/images/categories/snacks.jpg" },
    "beverages": { icon: "🥤", bg: "bg-rose-50 text-rose-900 border-rose-100", img: "/images/categories/beverages.jpg" },
    "household": { icon: "🧼", bg: "bg-teal-50 text-teal-900 border-teal-100", img: "/images/categories/household.jpg" },
    "personal-care": { icon: "🧴", bg: "bg-purple-50 text-purple-900 border-purple-100", img: "/images/categories/personal-care.jpg" },
    "breakfast": { icon: "🥣", bg: "bg-orange-50 text-orange-900 border-orange-100", img: "/images/categories/breakfast.jpg" },
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Hero Promotional Banners */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Banner 1: 10 Mins Delivery */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-200 p-5 sm:p-6 text-ink shadow-sm flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink text-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide">
              ⚡ 10 Mins Delivery
            </span>
            <h2 className="mt-2.5 text-xl sm:text-2xl font-black leading-tight">
              India&apos;s Last Minute App
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-semibold opacity-85">
              Fresh groceries & household essentials at your door in minutes.
            </p>
          </div>
          <div className="mt-3">
            <Link
              href="/category"
              className="inline-flex items-center gap-1 rounded-xl bg-ink text-white px-4 py-2 text-xs font-black shadow-sm hover:bg-slate-800 transition active:scale-95"
            >
              Order Now →
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 pointer-events-none select-none">
            🛒
          </div>
        </div>

        {/* Banner 2: Fresh Dairy & Morning Essentials */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide">
              🥛 Fresh Dairy Daily
            </span>
            <h2 className="mt-2.5 text-xl sm:text-2xl font-black leading-tight">
              Amul, Curd & Butter
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100 font-medium">
              Chilled toned milk, creamy butter & paneer delivered instant.
            </p>
          </div>
          <div className="mt-3">
            <Link
              href="/category/dairy-eggs"
              className="inline-flex items-center gap-1 rounded-xl bg-white text-emerald-900 px-4 py-2 text-xs font-black shadow-sm hover:bg-emerald-50 transition active:scale-95"
            >
              Explore Dairy →
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 pointer-events-none select-none">
            🧀
          </div>
        </div>

        {/* Banner 3: Munchies & Snacks */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide">
              🍿 Craving Sorted
            </span>
            <h2 className="mt-2.5 text-xl sm:text-2xl font-black leading-tight">
              Maggi, Chips & Coke
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-rose-100 font-medium">
              Biscuits, chocolates & soft drinks ready whenever you want.
            </p>
          </div>
          <div className="mt-3">
            <Link
              href="/category/snacks"
              className="inline-flex items-center gap-1 rounded-xl bg-white text-rose-900 px-4 py-2 text-xs font-black shadow-sm hover:bg-rose-50 transition active:scale-95"
            >
              Get Snacks →
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 pointer-events-none select-none">
            🍫
          </div>
        </div>
      </section>

      {/* Visual Category Rail (Blinkit Signature Grid) */}
      <section>
        <SectionTitle title="Shop by Category" subtitle="Explore your daily essentials" href="/category" />
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-4">
          {categories.map((c) => {
            const visual = categoryVisuals[c.slug] ?? {
              icon: "🛍️",
              bg: "bg-slate-50 text-slate-800 border-slate-100",
              img: `/images/categories/${c.slug}.jpg`,
            };
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group flex flex-col items-center text-center rounded-2xl bg-white border border-slate-100 p-2 sm:p-3 shadow-xs hover:border-emerald-500 hover:shadow-md transition duration-200"
              >
                <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-2xl overflow-hidden bg-slate-50 p-1 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition duration-200">
                  <ProductImage
                    src={visual.img}
                    alt={c.name}
                    className="h-full w-full object-cover rounded-xl"
                  />
                </div>
                <span className="mt-2 text-xs sm:text-sm font-bold text-ink leading-tight group-hover:text-emerald-700 transition line-clamp-2">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Instant Dairy, Bread & Eggs Rail */}
      {dairyItems.length > 0 ? (
        <section>
          <SectionTitle
            title="🥛 Dairy, Bread & Eggs"
            subtitle="Amul milk, butter, cheese, and curd in 10 mins"
            href="/category/dairy-eggs"
          />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {dairyItems.map((v) => (
              <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Deals of the Day (Blinkit Super Saver) */}
      {discountDeals.length > 0 ? (
        <section className="rounded-3xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 p-4 sm:p-6 border border-emerald-100">
          <SectionTitle
            title="🔥 Mega Savings on Daily Essentials"
            subtitle="Lowest prices guaranteed on grocery staples"
            actionText="view all deals"
          />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {discountDeals.map((v) => (
              <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Snacks & Munchies Rail */}
      {snackItems.length > 0 ? (
        <section>
          <SectionTitle
            title="🍿 Snacks & Munchies"
            subtitle="Biscuits, chips, Maggi & chocolates for your quick cravings"
            href="/category/snacks"
          />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {snackItems.map((v) => (
              <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Staples: Atta, Rice & Dal */}
      {stapleItems.length > 0 ? (
        <section>
          <SectionTitle
            title="🌾 Atta, Rice & Dal"
            subtitle="Aashirvaad, Fortune, Tata Salt & pulses"
            href="/category/staples"
          />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {stapleItems.map((v) => (
              <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Popular Right Now */}
      <section>
        <SectionTitle
          title="⚡ Trending in Your Area"
          subtitle="Most ordered items by neighbours this week"
        />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {popular.slice(0, 6).map((v) => (
            <BlinkitProductCard key={v.id} v={v as unknown as VariantCardProps} />
          ))}
        </div>
      </section>

      {/* Top Brands Pill Row */}
      <section className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-100 shadow-xs">
        <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider mb-3">Popular Brands</h3>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/search?q=${encodeURIComponent(b.name)}`}
              className="rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
