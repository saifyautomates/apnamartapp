"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BlinkitProductCard, VariantCardProps } from "./product-card";

export interface ProductCarouselProps {
  title: string;
  seeAllHref?: string;
  items: VariantCardProps[];
  autoSlideInterval?: number; // ms between slides (default 3800)
}

export function ProductCarousel({
  title,
  seeAllHref,
  items,
  autoSlideInterval = 3800,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 12);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 12);
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
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
  }, [checkScroll, items]);

  const scrollByAmount = useCallback((amount: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  // Smooth Auto-Slide on Desktop & Large screens
  useEffect(() => {
    // If user is actively hovering or dragging, pause auto-glide
    if (isHovered || isDragging || items.length <= 3) return;

    const timer = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      // If reached near end, smoothly rewind to beginning
      if (scrollLeft >= scrollWidth - clientWidth - 25) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        // Step forward by 1 card (~210px) with smooth momentum
        const step = window.innerWidth >= 1024 ? 220 : 175;
        scrollRef.current.scrollBy({ left: step, behavior: "smooth" });
      }
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [isHovered, isDragging, autoSlideInterval, items.length]);

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
    if (e.button !== 0) return;
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

  if (!items || items.length === 0) return null;

  return (
    <section
      className="relative my-7 sm:my-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Editorial Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-xl font-black text-[#1c1c1c] tracking-tight">
            {title}
          </h2>

          {/* Premium Auto-Glide Status Pill (Desktop only) */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100/80 border border-neutral-200/50 text-[10px] font-bold text-neutral-600 shadow-2xs select-none transition-all">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
                isHovered ? "bg-amber-400" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span>{isHovered ? "Paused on hover" : "Auto-glide"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress Indicator Line */}
          <div className="hidden md:block w-20 h-1 bg-neutral-100 rounded-full overflow-hidden mr-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(15, scrollProgress)}%` }}
            />
          </div>

          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="group text-xs sm:text-sm font-black text-[#0c831f] hover:text-[#0a701a] flex items-center gap-1 active:scale-95 transition cursor-pointer"
            >
              <span>View All</span>
              <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Carousel Track Container */}
      <div className="relative group/carousel">
        {/* Left Arrow Button with Frosted Glassmorphism */}
        {canScrollLeft ? (
          <button
            onClick={() => scrollByAmount(-440)}
            className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Slide previous"
          >
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}

        {/* Scrollable Track */}
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
          className={`flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-touch-x select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-[155px] sm:w-[195px] shrink-0 transition-transform duration-300"
            >
              <BlinkitProductCard v={item} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button with Frosted Glassmorphism */}
        {canScrollRight ? (
          <button
            onClick={() => scrollByAmount(440)}
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Slide next"
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

export default ProductCarousel;
