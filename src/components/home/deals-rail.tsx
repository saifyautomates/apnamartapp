"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { openProductSheet } from "@/components/product/product-detail-modal";
import { formatPaise } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import { VariantCardProps } from "@/components/product/product-card";
import { AddButton } from "@/components/product/add-button";

export interface DealsRailProps {
  items: VariantCardProps[];
}

export function DealsRail({ items }: DealsRailProps) {
  // Countdown timer: 06:23:41 (ticking down)
  const [secondsLeft, setSecondsLeft] = useState(23021);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  // Deduplicate deals so every card is a distinct, high-impact product
  const seenProds = new Set<string>();
  const uniqueDeals: VariantCardProps[] = [];
  for (const item of items) {
    const pSlug = item.product?.slug || item.id;
    if (!seenProds.has(pSlug)) {
      seenProds.add(pSlug);
      uniqueDeals.push(item);
    }
  }
  const dealProducts = uniqueDeals.slice(0, 10);

  if (dealProducts.length === 0) return null;

  return (
    <section id="deals" className="space-y-3 pt-2">
      {/* Header: Today's Best Deals & Live Countdown Timer */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm font-black shadow-xs animate-pulse">
            ⚡
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight flex items-center gap-1.5">
              <span>Today&apos;s Best Deals</span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Lowest Prices
              </span>
            </h3>
          </div>
        </div>

        {/* Countdown Timer Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/90 border border-red-200/60 text-[11px] font-black text-red-600 shadow-xs">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-neutral-500 font-semibold text-[10px]">Ends in</span>
          <span className="tabular-nums font-mono font-black text-red-700 tracking-tight">
            {hours}:{mins}:{secs}
          </span>
        </div>
      </div>

      {/* Horizontal Deal Cards with Smooth Native Scroll */}
      <div className="flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar pb-2 px-1 scroll-touch-x">
        {dealProducts.map((p) => {
          const price = p.sellingPaise;
          const mrp = p.mrpPaise > price ? p.mrpPaise : Math.round(price * 1.25);
          const off = discountPercent(mrp, price) || 15;
          const slug = p.product?.slug || p.id;
          const name = p.product?.name || "Daily Essential";
          const image = p.product?.images?.[0]?.url || `/images/products/${slug}.jpg`;
          const packSize = p.packSize || "1 pack";

          return (
            <div
              key={p.id}
              className="group relative shrink-0 w-36 sm:w-44 rounded-3xl bg-white border border-neutral-100 hover:border-emerald-200/80 p-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Top Row: Discount Tag & Pack Badge */}
              <div className="flex items-center justify-between gap-1 z-10">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white px-2 py-0.5 text-[9px] sm:text-[10px] font-black tracking-tight shadow-xs">
                  {off}% OFF
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100/80 px-1.5 py-0.5 rounded-md truncate max-w-[70px]">
                  {packSize}
                </span>
              </div>

              {/* Product Artwork with Subtle Studio Backdrop */}
              <div
                onClick={() =>
                  openProductSheet({
                    slug,
                    initialName: name,
                    initialPrice: price,
                    initialMrp: mrp,
                    initialImage: image,
                  })
                }
                className="relative h-28 sm:h-32 w-full flex items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-neutral-50/70 to-white my-2 cursor-pointer overflow-hidden"
              >
                <ProductImage
                  src={image}
                  alt={name}
                  className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title & Price & ADD Action */}
              <div className="space-y-2">
                <h4
                  onClick={() =>
                    openProductSheet({
                      slug,
                      initialName: name,
                      initialPrice: price,
                      initialMrp: mrp,
                      initialImage: image,
                    })
                  }
                  title={name}
                  className="text-xs sm:text-sm font-bold text-[#1c1c1c] group-hover:text-[#0c831f] transition-colors line-clamp-2 min-h-[2.2rem] leading-snug cursor-pointer"
                >
                  {name}
                </h4>

                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-neutral-100">
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs sm:text-sm font-black text-[#1c1c1c]">
                      {formatPaise(price)}
                    </span>
                    <span className="text-[10px] text-neutral-400 line-through">
                      {formatPaise(mrp)}
                    </span>
                  </div>

                  <div className="w-[64px] sm:w-[72px] shrink-0">
                    <AddButton variantId={p.id} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default DealsRail;
