import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

export interface HeroBannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  href?: string;
  imageSrc?: string;
  promiseBadge?: string;
}

export function HeroBanner({
  title = "Stock up on daily essentials",
  subtitle = "Order 100% genuine packaged FMCG brands — staples, dairy, munchies, cold drinks, cleaning & personal care with Same-Day Doorstep Delivery.",
  buttonText = "Shop Now",
  href = "/category/dairy-eggs",
  imageSrc = "/images/banners/central-mart-fmcg-hero.jpg",
  promiseBadge = "Same Day FMCG Delivery",
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c831f] via-[#107d22] to-[#146b2b] text-white shadow-xl cinematic-shine">
      {/* Background Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#f8cb46]/15 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-12 items-center p-6 sm:p-9 md:p-11 gap-6 z-10">
        {/* Left Column: Headline, Brand Tag, CTA */}
        <div className="md:col-span-7 space-y-4">
          {/* Animated Flash Pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-black/25 backdrop-blur-md px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#f8cb46] border border-white/10 animate-pulse-subtle">
            <span className="text-sm">⚡</span>
            <span>Central Mart · {promiseBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-white drop-shadow-xs">
            {title}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg font-medium text-emerald-100 max-w-xl leading-relaxed">
            {subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href={href}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#1c1c1c] font-black text-sm sm:text-base px-7 py-3.5 shadow-lg hover:bg-neutral-100 hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>{buttonText}</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-white/90 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10">
              <span className="text-base">🛡️</span>
              <span>100% Genuine Branded FMCG Goods</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual with Floating 3D Badges */}
        <div className="md:col-span-5 relative flex justify-center md:justify-end">
          <div className="relative h-56 sm:h-64 md:h-76 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/20 group">
            <ProductImage
              src={imageSrc}
              alt={title}
              priority
              className="h-full w-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
            />

            {/* Floating Glassmorphism Badge 1 (Top Left) */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-black px-3 py-1.5 rounded-xl border border-white/20 shadow-lg animate-float flex items-center gap-1.5">
              <span>⚡</span>
              <span>SAME DAY AT DOORSTEP</span>
            </div>

            {/* Floating Glassmorphism Badge 2 (Bottom Right) */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-[#0c831f] text-[11px] font-black px-3.5 py-1.5 rounded-xl border border-white/40 shadow-lg animate-float-delayed flex items-center gap-1.5">
              <span>🏷️</span>
              <span>100% GENUINE FMCG</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
