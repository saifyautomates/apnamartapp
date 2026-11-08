"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { StoreBanner } from "@/lib/banners";
import { openSearchModal } from "@/components/search/search-modal";

export interface HeroBannerProps {
  banners?: StoreBanner[];
}

export function HeroBanner({ banners: initialBanners }: HeroBannerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const bannerContainerRef = useRef<HTMLDivElement>(null);

  const bannerList: StoreBanner[] =
    initialBanners && initialBanners.length > 0
      ? initialBanners
      : [
          {
            id: "banner-1",
            title: "Daily Essentials",
            subtitle: "Grocery • Personal Care • Home Care & More",
            badgeText: "at Best Prices",
            buttonText: "Shop Now",
            href: "/category",
            imageUrl: "/images/banners/central-mart-fmcg-hero.jpg",
            bgGradient: "from-[#0a6833] via-[#0d783b] to-[#0f5c2e]",
            isActive: true,
            displayOrder: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: "banner-2",
            title: "Kota Superfast FMCG",
            subtitle: "Atta, Dal, Edible Oil & Snacks delivered in 12-15 Mins",
            badgeText: "Up to 35% OFF",
            buttonText: "Order Now",
            href: "/category/staples",
            imageUrl: "/images/banners/central-mart-fmcg-hero.jpg",
            bgGradient: "from-[#0a6c1a] via-[#0c831f] to-[#166534]",
            isActive: true,
            displayOrder: 2,
            createdAt: new Date().toISOString(),
          },
          {
            id: "banner-3",
            title: "Everyday Essentials",
            subtitle: "Cleaners, Soaps, Shampoos & Household Needs",
            badgeText: "Super Savings",
            buttonText: "Explore",
            href: "/category/cleaning-essentials",
            imageUrl: "/images/banners/central-mart-fmcg-hero.jpg",
            bgGradient: "from-[#0d7820] via-[#0c831f] to-[#085a14]",
            isActive: true,
            displayOrder: 3,
            createdAt: new Date().toISOString(),
          },
        ];

  const nextSlide = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % bannerList.length);
  }, [bannerList.length]);

  const prevSlide = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + bannerList.length) % bannerList.length);
  }, [bannerList.length]);

  // Auto-slide every 5 seconds, pauses on interaction
  useEffect(() => {
    if (bannerList.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerList.length, isPaused, nextSlide]);

  // Touch Swipe Handlers for mobile & tablet (Left/Right gestures)
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swiped left -> Next slide
      nextSlide();
    } else if (isRightSwipe) {
      // Swiped right -> Previous slide
      prevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const current = bannerList[activeIdx] || bannerList[0];

  return (
    <div
      className="space-y-2 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <section
        ref={bannerContainerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative group/banner overflow-hidden rounded-3xl shadow-md transition-all duration-300 touch-pan-y"
      >
        {/* Left Arrow Button for Desktop / Tablet */}
        {bannerList.length > 1 && (
          <button
            onClick={prevSlide}
            aria-label="Previous Banner"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/60 text-white items-center justify-center backdrop-blur-xs transition opacity-0 group-hover/banner:opacity-100 cursor-pointer active:scale-90"
          >
            ‹
          </button>
        )}

        {/* Right Arrow Button for Desktop / Tablet */}
        {bannerList.length > 1 && (
          <button
            onClick={nextSlide}
            aria-label="Next Banner"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/60 text-white items-center justify-center backdrop-blur-xs transition opacity-0 group-hover/banner:opacity-100 cursor-pointer active:scale-90"
          >
            ›
          </button>
        )}

        {/* Card with Fresh Green Gradient (Matches Screen 1 Mockup) */}
        <div
          className={`relative overflow-hidden bg-gradient-to-r ${current.bgGradient} text-white px-4 py-4 sm:px-8 sm:py-6 flex items-center justify-between min-h-[155px] sm:min-h-[195px] md:min-h-[220px] transition-colors duration-500`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-[#facc15]/15 blur-2xl pointer-events-none" />

          {/* Left Column: Headline, Lime Highlight, Subtitle & White Button */}
          <div className="max-w-[62%] sm:max-w-[60%] space-y-1.5 sm:space-y-2 z-10">
            <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
              Daily Essentials <br />
              <span className="text-[#a3e635] sm:text-[#facc15]">at Best Prices</span>
            </h2>

            <p className="text-[10px] sm:text-xs md:text-sm font-medium text-emerald-100/90 line-clamp-2">
              {current.subtitle}
            </p>

            <div className="pt-1">
              <button
                onClick={() => openSearchModal()}
                className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 text-[#1c1c1c] font-black text-xs sm:text-sm px-4 py-1.5 sm:px-6 sm:py-2.5 shadow-md active:scale-95 transition cursor-pointer"
              >
                <span>Shop Now</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Right Column: Fresh Grocery Basket Artwork */}
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-52 shrink-0 z-10 flex items-center justify-end">
            <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-lg border border-white/20">
              <Image
                src={current.imageUrl}
                alt={current.title}
                fill
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 208px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Dots Below (Matching Screen 1 Mockup) */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {bannerList.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIdx ? "w-6 bg-[#0c831f]" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroBanner;
