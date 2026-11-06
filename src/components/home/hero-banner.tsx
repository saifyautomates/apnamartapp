"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { StoreBanner } from "@/lib/banners";

export interface HeroBannerProps {
  banners?: StoreBanner[];
  title?: string;
  subtitle?: string;
  buttonText?: string;
  href?: string;
  imageSrc?: string;
  promiseBadge?: string;
}

export function HeroBanner({
  banners: initialBanners,
  title: fallbackTitle = "Mega FMCG Grocery Sale",
  subtitle: fallbackSubtitle = "Up to 35% OFF on Dairy, Atta, Oil & Snacks",
  buttonText: fallbackBtn = "Shop Deals",
  href: fallbackHref = "/category/dairy-eggs",
  imageSrc: fallbackImg = "/images/banners/central-mart-fmcg-hero.jpg",
  promiseBadge: fallbackBadge = "⚡ SAME DAY DOORSTEP DELIVERY",
}: HeroBannerProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const bannerList: StoreBanner[] =
    initialBanners && initialBanners.length > 0
      ? initialBanners
      : [
          {
            id: "default-1",
            title: fallbackTitle,
            subtitle: fallbackSubtitle,
            badgeText: fallbackBadge,
            buttonText: fallbackBtn,
            href: fallbackHref,
            imageUrl: fallbackImg,
            bgGradient: "from-[#0c831f] via-[#107d22] to-[#146b2b]",
            isActive: true,
            displayOrder: 1,
            createdAt: new Date().toISOString(),
          },
        ];

  // Auto-slide every 5 seconds if multiple banners
  useEffect(() => {
    if (bannerList.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % bannerList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerList.length]);

  const current = bannerList[activeIdx] || bannerList[0];

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-md transition-all duration-300">
      {/* Sleek, Compact Container (145px on mobile, 220px on tablet, 250px on desktop) */}
      <div
        className={`relative overflow-hidden bg-gradient-to-r ${current.bgGradient} text-white px-4 py-3.5 sm:px-8 sm:py-6 flex items-center justify-between min-h-[145px] sm:min-h-[190px] md:min-h-[220px] lg:min-h-[245px]`}
      >
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[#f8cb46]/15 blur-3xl pointer-events-none" />

        {/* Left Column: Compact Headline, Offer Badge, CTA */}
        <div className="max-w-[65%] sm:max-w-[60%] space-y-1.5 sm:space-y-2.5 z-10">
          {/* Animated Compact Flash Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-2.5 py-0.5 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-[#f8cb46] border border-white/10">
            <span>⚡</span>
            <span className="truncate">{current.badgeText}</span>
          </div>

          <h2 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white line-clamp-2 drop-shadow-xs">
            {current.title}
          </h2>

          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-emerald-100/90 line-clamp-1 sm:line-clamp-2">
            {current.subtitle}
          </p>

          <div className="pt-1 sm:pt-2">
            <Link
              href={current.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#1c1c1c] font-black text-[11px] sm:text-xs md:text-sm px-4 py-1.5 sm:px-6 sm:py-2.5 shadow-md hover:bg-neutral-100 hover:shadow-lg transition active:scale-95 cursor-pointer"
            >
              <span>{current.buttonText}</span>
              <span className="text-xs sm:text-sm">→</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Artwork (Compact, Responsive) */}
        <div className="relative h-28 w-28 sm:h-40 sm:w-40 md:h-48 md:w-56 shrink-0 z-10 flex items-center justify-end">
          <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-lg border border-white/20 group">
            <Image
              src={current.imageUrl}
              alt={current.title}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 112px, (max-width: 768px) 160px, 224px"
            />
            {/* 100% Genuine Badge */}
            <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-lg border border-white/20 hidden sm:flex items-center gap-1">
              <span>🏷️</span>
              <span>100% GENUINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-banner Pagination Dots */}
      {bannerList.length > 1 ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {bannerList.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIdx === i ? "w-6 bg-white shadow-xs" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default HeroBanner;
