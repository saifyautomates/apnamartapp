import { prisma } from "@/lib/prisma";
import { cachedJson } from "@/lib/cache";
import { getStoreBanners } from "@/lib/banners";
import { HeroBanner, PromoCards, CategoryGrid } from "@/components/home";
import { ProductCarousel, VariantCardProps } from "@/components/product";

export default async function HomePage() {
  const [dairyItems, snackItems, drinkItems, stapleItems, personalCareItems, deals, storeBanners] = await cachedJson(
    "home_rails_fmcg_v1",
    30,
    async () => {
      return Promise.all([
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

        // Personal Care & Cleaning Essentials
        prisma.productVariant.findMany({
          where: {
            product: {
              category: { slug: { in: ["personal-care", "cleaning-essentials", "household"] } },
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

        // Store Banners
        getStoreBanners(),
      ]);
    }
  );

  const discountDeals = deals.filter((v) => v.sellingPaise < v.mrpPaise).slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* 1. Sleek, Compact Customer Hero Banner Carousel (Admin Managed) */}
      <HeroBanner banners={storeBanners} />

      {/* 2. Three Promotional Cards Row (Horizontal Swipe on Mobile) */}
      <PromoCards />

      {/* 3. Blinkit Signature 2-Row FMCG Category Rail (20 Packaged Categories) */}
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

      {/* Rail 5: Personal Care & Cleaning Essentials */}
      {personalCareItems.length > 0 ? (
        <ProductCarousel
          title="Personal Care & Cleaning Essentials"
          seeAllHref="/category/personal-care"
          items={personalCareItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 6: Best Offers & Savings */}
      {discountDeals.length > 0 ? (
        <ProductCarousel
          title="🔥 Best Offers on FMCG Essentials"
          seeAllHref="/category"
          items={discountDeals as unknown as VariantCardProps[]}
        />
      ) : null}
    </div>
  );
}
