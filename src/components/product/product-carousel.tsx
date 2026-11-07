"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { BlinkitProductCard, VariantCardProps } from "./product-card";

export interface ProductCarouselProps {
  title: string;
  seeAllHref?: string;
  items: VariantCardProps[];
}

export function ProductCarousel({ title, seeAllHref, items }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

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
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -460 : 460;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-6 sm:my-8">
      {/* Header: Title and "View All ->" (Matches Mockup Screen 1) */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base sm:text-xl font-black text-[#1c1c1c] tracking-tight">{title}</h2>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="text-xs sm:text-sm font-bold text-[#0c831f] hover:text-[#0a701a] flex items-center gap-0.5 active:scale-95 transition cursor-pointer"
          >
            <span>View All</span>
            <span className="text-xs">→</span>
          </Link>
        ) : null}
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow Button */}
        {canScrollLeft ? (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-neutral-200/90 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 hover:shadow-lg transition active:scale-95 cursor-pointer"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}

        {/* Scrollable Track with Native Touch Momentum and Snap */}
        <div
          ref={scrollRef}
          className="flex gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 snap-x snap-mandatory scroll-touch"
        >
          {items.map((item) => (
            <div key={item.id} className="w-[155px] sm:w-[195px] shrink-0 snap-start">
              <BlinkitProductCard v={item} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button (matches Blinkit floating circle) */}
        {canScrollRight ? (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-neutral-200/90 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 hover:shadow-lg transition active:scale-95 cursor-pointer"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default ProductCarousel;

