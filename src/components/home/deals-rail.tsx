"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "@/components/product/product-image";
import { openProductSheet } from "@/components/product/product-detail-modal";
import { formatPaise } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import { VariantCardProps } from "@/components/product/product-card";

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

  const dealProducts = items.length > 0 ? items.slice(0, 8) : [];

  return (
    <section id="deals" className="space-y-3 pt-2">
      {/* Header: Today's Best Deals & Countdown Timer (Matches Phone 1 Mockup) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 text-lg">⚡</span>
          <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
            Today&apos;s Best Deals
          </h3>
        </div>

        {/* Countdown Timer Pill */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-[11px] font-black text-red-600 shadow-xs">
          <span className="text-neutral-500 font-medium text-[10px]">Ends in</span>
          <span className="tabular-nums font-mono">{hours} : {mins} : {secs}</span>
        </div>
      </div>

      {/* Horizontal Deal Cards (Matches Phone 1 Mockup) */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 scroll-touch">
        {dealProducts.map((p) => {
          const price = p.sellingPaise;
          const mrp = p.mrpPaise > price ? p.mrpPaise : Math.round(price * 1.25);
          const off = discountPercent(mrp, price) || 20;
          const slug = p.product?.slug || p.id;
          const name = p.product?.name || "Daily Essential";
          const image = p.product?.images?.[0]?.url || `/images/products/${slug}.jpg`;

          return (
            <div
              key={p.id}
              onClick={() =>
                openProductSheet({
                  slug,
                  initialName: name,
                  initialPrice: price,
                  initialMrp: mrp,
                  initialImage: image,
                })
              }
              className="relative shrink-0 w-32 sm:w-36 rounded-2xl bg-white border border-neutral-100 p-2.5 shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer flex flex-col justify-between"
            >
              {/* Discount Tag on Top Left (Matches Phone 1 Mockup) */}
              <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black shadow-xs">
                {off}% OFF
              </span>

              {/* Product Artwork */}
              <div className="relative h-24 w-full flex items-center justify-center p-1 bg-[#fafafa] rounded-xl mt-3">
                <ProductImage
                  src={image}
                  alt={name}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Title & Price */}
              <div className="mt-2 space-y-0.5">
                <h4 className="text-xs font-black text-[#1c1c1c] truncate">{name}</h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-[#1c1c1c]">{formatPaise(price)}</span>
                  <span className="text-[10px] text-neutral-400 line-through">{formatPaise(mrp)}</span>
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
