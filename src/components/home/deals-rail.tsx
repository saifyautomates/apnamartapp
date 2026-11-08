"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // High-performance pointer refs: zero async state lag for instant 60fps drag
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

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

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll, dealProducts]);

  // Desktop Auto-Slide Glide
  useEffect(() => {
    if (isHovered || isDragging || dealProducts.length <= 2) return;

    const timer = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      if (scrollLeft >= scrollWidth - clientWidth - 20) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const step = window.innerWidth >= 640 ? 190 : 155;
        scrollRef.current.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 3600);

    return () => clearInterval(timer);
  }, [isHovered, isDragging, dealProducts.length]);

  const scrollByAmount = (amount: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Global window pointerup listener so drag ends even if mouse is released outside
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isPointerDownRef.current) {
        isPointerDownRef.current = false;
        setIsDragging(false);
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 80);
      }
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    // Primary mouse button only
    if (e.button !== 0) return;
    // Mobile touch screens have 120Hz native momentum scrolling; don't fight native gesture
    if (e.pointerType === "touch") return;

    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    scrollStartRef.current = scrollRef.current.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !scrollRef.current) return;
    if (e.pointerType === "touch") return;

    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 8) {
      hasDraggedRef.current = true;
      if (!isDragging) setIsDragging(true);
      scrollRef.current.scrollLeft = scrollStartRef.current - delta;
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 80);
  };

  if (dealProducts.length === 0) return null;

  return (
    <section
      id="deals"
      className="space-y-3 pt-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Header: Today's Best Deals & Live Countdown Timer */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-sm font-black shadow-xs animate-pulse">
            ⚡
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
              Today&apos;s Best Deals
            </h3>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/80">
              Lowest Wholesale Prices
            </span>
            {/* Auto-slide status pill */}
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-neutral-400 font-semibold pl-1">
              <span className={`h-1.5 w-1.5 rounded-full ${isHovered ? "bg-amber-400" : "bg-emerald-500 animate-ping"}`} />
              {isHovered ? "Paused on hover" : "Auto-sliding"}
            </span>
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

      {/* Relative Track with Frosted Glass Arrows */}
      <div className="relative group/deals">
        {/* Left Arrow Button */}
        {canScrollLeft ? (
          <button
            onClick={() => scrollByAmount(-380)}
            className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Previous deals"
          >
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}

        {/* Horizontal Deal Cards with Smooth Native Scroll & Mouse Drag */}
        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onClickCapture={(e) => {
            if (hasDraggedRef.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className={`flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar pb-3 pt-1 px-1 scroll-touch-x select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
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
                className="group relative shrink-0 w-36 sm:w-44 rounded-3xl bg-white border border-neutral-100 hover:border-emerald-200/80 p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_-8px_rgba(12,131,31,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
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

                {/* Product Artwork with Subtle Studio Pedestal Backdrop */}
                <Link
                  href={`/product/${slug}`}
                  prefetch={true}
                  className="relative h-28 sm:h-32 w-full flex items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-neutral-50/80 via-emerald-50/10 to-white my-2 cursor-pointer overflow-hidden group-hover:bg-emerald-50/30 transition-colors"
                >
                  <ProductImage
                    src={image}
                    alt={name}
                    className="h-full w-full object-contain group-hover:scale-108 transition-transform duration-300"
                  />
                </Link>

                {/* Title & Price & ADD Action */}
                <div className="space-y-2">
                  <Link
                    href={`/product/${slug}`}
                    prefetch={true}
                    title={name}
                    className="text-xs sm:text-sm font-bold text-[#1c1c1c] group-hover:text-[#0c831f] transition-colors line-clamp-2 min-h-[2.2rem] leading-snug cursor-pointer block"
                  >
                    {name}
                  </Link>

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

        {/* Right Arrow Button */}
        {canScrollRight ? (
          <button
            onClick={() => scrollByAmount(380)}
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Next deals"
          >
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default DealsRail;
