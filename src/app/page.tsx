import { getHomeRailsSafe } from "@/lib/resilient-catalog";
import { HeroBanner, PromoCards, CategoryGrid } from "@/components/home";
import { ProductCarousel, VariantCardProps } from "@/components/product";

export default async function HomePage() {
  const { dairyItems, snackItems, drinkItems, stapleItems, personalCareItems, deals, storeBanners } =
    await getHomeRailsSafe();

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
