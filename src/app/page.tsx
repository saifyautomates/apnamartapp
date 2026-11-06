import { prisma } from "@/lib/prisma";
import { HeroBanner, PromoCards, CategoryGrid } from "@/components/home";
import { ProductCarousel, VariantCardProps } from "@/components/product";

export default async function HomePage() {
  const [dairyItems, snackItems, drinkItems, stapleItems, deals] = await Promise.all([
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
      take: 12,
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
      take: 12,
    }),

    // Cold Drinks & Juices
    prisma.productVariant.findMany({
      where: {
        product: {
          category: { slug: { in: ["cold-drinks", "beverages", "tea-coffee"] } },
          isActive: true,
          onlineVisible: true,
          deletedAt: null,
        },
      },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      take: 12,
    }),

    // Atta, Rice & Dal (Staples)
    prisma.productVariant.findMany({
      where: {
        product: {
          category: { slug: { in: ["staples", "masala-oil"] } },
          isActive: true,
          onlineVisible: true,
          deletedAt: null,
        },
      },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      take: 12,
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
      take: 30,
    }),
  ]);

  const discountDeals = deals.filter((v) => v.sellingPaise < v.mrpPaise).slice(0, 10);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Hero Big Banner */}
      <HeroBanner />

      {/* 2. Three Promotional Cards Row */}
      <PromoCards />

      {/* 3. Blinkit Signature 2-Row Category Rail (20 Categories) */}
      <CategoryGrid />

      {/* 4. Product Rails */}
      {/* Rail 1: Dairy, Bread & Eggs */}
      {dairyItems.length > 0 ? (
        <ProductCarousel
          title="Dairy, Bread & Eggs"
          seeAllHref="/category/dairy-eggs"
          items={dairyItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 2: Snacks & Munchies */}
      {snackItems.length > 0 ? (
        <ProductCarousel
          title="Snacks & Munchies"
          seeAllHref="/category/snacks"
          items={snackItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 3: Cold Drinks & Juices */}
      {drinkItems.length > 0 ? (
        <ProductCarousel
          title="Cold Drinks & Juices"
          seeAllHref="/category/cold-drinks"
          items={drinkItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 4: Atta, Rice & Dal */}
      {stapleItems.length > 0 ? (
        <ProductCarousel
          title="Atta, Rice & Dal"
          seeAllHref="/category/staples"
          items={stapleItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 5: Best Offers & Savings */}
      {discountDeals.length > 0 ? (
        <ProductCarousel
          title="🔥 Best Offers on Groceries"
          seeAllHref="/category"
          items={discountDeals as unknown as VariantCardProps[]}
        />
      ) : null}
    </div>
  );
}
