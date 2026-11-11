import { getHomeRailsSafe } from "@/lib/resilient-catalog";
import { getStoreOffers } from "@/lib/offers";
import { HeroBanner, PromoCards, CategoryGrid, DealsRail } from "@/components/home";
import { FlashSaleBar } from "@/components/home/flash-sale-bar";
import { CentralMartHeroFeed } from "@/components/home/central-mart-hero-feed";
import { ProductCarousel, VariantCardProps } from "@/components/product";
import { MapPin, Phone, Clock } from "lucide-react";

export default async function HomePage() {
  const [{ dairyItems, snackItems, drinkItems, stapleItems, personalCareItems, deals, storeBanners }, storeOffers] =
    await Promise.all([getHomeRailsSafe(), getStoreOffers()]);

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
      {/* 0. Central Mart Hero Showcase (Matches Mockup Screen 2: Promo Banner, 4 Circles, Trust Card, Popular Categories) */}
      <CentralMartHeroFeed />

      {/* 0.1 Live Ticking Flash Sale Announcement Bar */}
      {storeOffers && storeOffers.length > 0 ? (
        <FlashSaleBar initialOffers={storeOffers} />
      ) : null}

      {/* 1. Hero Banner Carousel with "Daily Essentials at Best Prices" (Matches Phone 1 Mockup) */}
      <HeroBanner banners={storeBanners} />

      {/* 2. Shop by Category Section with 8 Tiles (Matches Phone 1 Mockup) */}
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
          title="Best Deals & Value Packs"
          seeAllHref="/category"
          items={discountDeals as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* 6. Kota Local SEO Showcase (80 Feet Road Hub) */}
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c831f] text-white">
                <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#1c1c1c]">
                Central Mart Darkstore &amp; Supermarket — 80 Feet Road, Kota
              </h2>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-3xl">
              Kota&apos;s leading online FMCG grocery store located at <strong>80 Feet Road</strong>. Delivering 100% genuine packaged staples (Atta, Rice, Dal), Amul &amp; Saras Dairy, snacks, beverages, cleaning &amp; personal care essentials with <strong>Same-Day Doorstep Delivery</strong> across Kota.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-emerald-800 font-semibold">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/90 px-2 py-0.5 font-bold">
                <Clock className="w-3 h-3 text-[#0c831f]" />
                80 Feet Road (10-15 Min Delivery)
              </span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5">Talwandi</span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5">Nayapura</span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5">Vigyan Nagar</span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5">Dadabari</span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5">Mahaveer Nagar</span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5">Kunhari &amp; Landmark City</span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5">Jawahar Nagar</span>
            </div>
          </div>
          <div className="shrink-0 text-left md:text-right border-t md:border-t-0 md:border-l border-emerald-100 pt-3 md:pt-0 md:pl-5 space-y-1 text-xs text-neutral-600">
            <p className="font-bold text-[#1c1c1c]">Store Timings: 8:00 AM – 10:00 PM</p>
            <p className="text-[#0c831f] font-bold flex items-center md:justify-end gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>Helpline: +91 98290 12345</span>
            </p>
            <p className="text-[11px] text-neutral-500">80 Feet Road, Kota - 324005</p>
          </div>
        </div>
      </section>
    </div>
  );
}
