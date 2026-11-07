import { getHomeRailsSafe } from "@/lib/resilient-catalog";
import { HeroBanner, PromoCards, CategoryGrid, QuickFeatures, DealsRail } from "@/components/home";
import { ProductCarousel, VariantCardProps } from "@/components/product";

export default async function HomePage() {
  const { dairyItems, snackItems, drinkItems, stapleItems, personalCareItems, deals, storeBanners } =
    await getHomeRailsSafe();

  const discountDeals = deals.filter((v) => v.sellingPaise < v.mrpPaise).slice(0, 10);

  // Combine top popular items for the "Popular Products" Rail (Matching Screen 1 Mockup)
  const popularItems = [
    ...dairyItems.slice(0, 4),
    ...snackItems.slice(0, 4),
    ...drinkItems.slice(0, 3),
    ...stapleItems.slice(0, 3),
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* 1. Hero Banner Carousel with "Daily Essentials at Best Prices" (Matches Phone 1 Mockup) */}
      <HeroBanner banners={storeBanners} />

      {/* 2. 4 Quick Value Badges: Fast Delivery, 100% Original, Best Prices, Easy Returns (Matches Phone 1 Mockup) */}
      <QuickFeatures />

      {/* 3. Shop by Category Section with 8 Tiles (Matches Phone 1 Mockup) */}
      <CategoryGrid />

      {/* 4. Today's Best Deals with Countdown Timer (Matches Phone 1 Mockup) */}
      <DealsRail items={discountDeals.length > 0 ? (discountDeals as unknown as VariantCardProps[]) : (popularItems as unknown as VariantCardProps[])} />

      {/* 5. Popular Products Grid / Carousel with Bestseller & Heart Wishlist (Matches Screen 1 Mockup) */}
      {popularItems.length > 0 ? (
        <ProductCarousel
          title="Popular Products"
          seeAllHref="/category"
          items={popularItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* 4. Three Promotional Cards Row (Savings & Flash Deals) */}
      <PromoCards />

      {/* 5. Category Product Rails */}
      {/* Rail: Dairy, Bread & Eggs */}
      {dairyItems.length > 0 ? (
        <ProductCarousel
          title="Dairy, Bread & Eggs"
          seeAllHref="/category/dairy-eggs"
          items={dairyItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail: Snacks & Munchies */}
      {snackItems.length > 0 ? (
        <ProductCarousel
          title="Snacks & Munchies"
          seeAllHref="/category/snacks"
          items={snackItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail: Cold Drinks & Juices */}
      {drinkItems.length > 0 ? (
        <ProductCarousel
          title="Cold Drinks & Juices"
          seeAllHref="/category/cold-drinks"
          items={drinkItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail: Atta, Rice & Dal */}
      {stapleItems.length > 0 ? (
        <ProductCarousel
          title="Atta, Rice & Dal"
          seeAllHref="/category/staples"
          items={stapleItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail: Personal Care & Household */}
      {personalCareItems.length > 0 ? (
        <ProductCarousel
          title="Personal Care & Household"
          seeAllHref="/category/personal-care"
          items={personalCareItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail: Best Offers */}
      {discountDeals.length > 0 ? (
        <ProductCarousel
          title="🔥 Best Offers & Deals"
          seeAllHref="/category"
          items={discountDeals as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* 6. Four Central Mart Trust Badges (Matches Bottom of Poster Mockup) */}
      <section className="pt-4 pb-2 border-t border-neutral-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f8faf8] border border-neutral-100 shadow-xs">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] text-lg">
              🍃
            </span>
            <div className="leading-tight">
              <p className="text-xs font-black text-[#1c1c1c]">Farm Fresh Produce</p>
              <p className="text-[10px] text-neutral-400 font-medium">Naturally Sourced</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f8faf8] border border-neutral-100 shadow-xs">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] text-lg">
              🛡️
            </span>
            <div className="leading-tight">
              <p className="text-xs font-black text-[#1c1c1c]">100% Quality Assured</p>
              <p className="text-[10px] text-neutral-400 font-medium">Carefully Inspected</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f8faf8] border border-neutral-100 shadow-xs">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] text-lg">
              🛵
            </span>
            <div className="leading-tight">
              <p className="text-xs font-black text-[#1c1c1c]">Same Day Delivery*</p>
              <p className="text-[10px] text-[#0c831f] font-bold">⚡ 12-15 Mins in Kota</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f8faf8] border border-neutral-100 shadow-xs">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] text-lg">
              🏷️
            </span>
            <div className="leading-tight">
              <p className="text-xs font-black text-[#1c1c1c]">Exciting Offers & Deals</p>
              <p className="text-[10px] text-neutral-400 font-medium">Best Prices Guaranteed</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
