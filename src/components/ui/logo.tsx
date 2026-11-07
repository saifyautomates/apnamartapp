"use client";

import Link from "next/link";

export interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  showKotaBadge?: boolean;
  subtitle?: string;
  theme?: "light" | "dark";
  href?: string;
}

export function CentralMartLogo({
  className = "",
  size = "md",
  showBadge = false,
  showKotaBadge = true,
  subtitle = "Online Grocery Store · Kota",
  theme = "light",
  href = "/",
}: LogoProps) {
  const isDark = theme === "dark";

  const sizeClasses = {
    xs: "text-lg sm:text-xl",
    sm: "text-xl sm:text-2xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
    xl: "text-4xl sm:text-5xl",
  };

  const iconSizes = {
    xs: "h-7 w-7",
    sm: "h-8 w-8",
    md: "h-9 w-9 sm:h-10 sm:w-10",
    lg: "h-11 w-11 sm:h-12 sm:w-12",
    xl: "h-14 w-14",
  };

  const svgIconSizes = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 select-none relative focus:outline-none transition-transform duration-200 ${className}`}
      aria-label="Central Mart - Kota Online Grocery Store"
    >
      {/* 3D Modern FMCG Shopping Basket Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        <div
          className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-[#0c831f] via-[#159a2a] to-[#22c55e] shadow-md shadow-emerald-950/15 flex items-center justify-center text-white transform group-hover:scale-105 group-hover:rotate-[-3deg] transition-all duration-300 ring-2 ${
            isDark ? "ring-emerald-400/30" : "ring-emerald-600/15"
          }`}
        >
          {/* Subtle Top Inner Sheen */}
          <div className="absolute inset-x-1 top-0.5 h-1/3 bg-gradient-to-b from-white/35 to-transparent rounded-t-xl pointer-events-none" />

          {/* Supermarket Shopping Cart with Fresh Leaves Vector */}
          <svg
            className={`${svgIconSizes[size]} text-white drop-shadow-sm`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.3"
          >
            {/* Shopping Bag / Grocery Tote Shape */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M4.5 9h15l1.2 11.2a1.5 1.5 0 01-1.5 1.6H4.8a1.5 1.5 0 01-1.5-1.6L4.5 9z"
            />
            {/* Center Fresh Leaf Accent */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 12c1.5 0 2.5 1 2.5 2.5a2.5 2.5 0 01-5 0c0-1.5 1-2.5 2.5-2.5z"
              className="text-emerald-200 fill-emerald-100/40"
            />
          </svg>

          {/* Lightning Speed Accent Badge */}
          <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full bg-gradient-to-tr from-[#eab308] to-[#facc15] text-[#1c1c1c] text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md ring-2 ring-white transform group-hover:scale-110 transition-transform">
            ⚡
          </span>
        </div>
      </div>

      {/* Brand Wordmark with Premium Typography */}
      <div className="flex flex-col leading-none">
        <div className={`font-black tracking-tight font-sans flex items-baseline ${sizeClasses[size]}`}>
          <span
            className={`${
              isDark
                ? "text-white group-hover:text-emerald-200"
                : "text-[#1c1c1c] group-hover:text-black"
            } transition-colors tracking-tight`}
          >
            central
          </span>
          <span className="text-[#0c831f] group-hover:brightness-110 transition-all tracking-tight ml-0.5">
            mart
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0c831f] ml-1 mb-0.5" />
        </div>

        {/* Dynamic Subtitle / Kota Tagline */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`text-[9px] sm:text-[10px] font-black tracking-wider uppercase transition-colors ${
              isDark
                ? "text-emerald-300/80 group-hover:text-emerald-200"
                : "text-neutral-400 group-hover:text-[#0c831f]"
            }`}
          >
            {subtitle}
          </span>
        </div>
      </div>

      {/* Kota / Speed Badge */}
      {showKotaBadge ? (
        <span
          className={`hidden md:inline-flex items-center gap-1 rounded-full text-[9px] font-black px-2 py-0.5 uppercase tracking-wider shadow-xs ${
            isDark
              ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700/50"
              : "bg-emerald-50 text-[#0c831f] border border-emerald-300/80"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0c831f] animate-pulse" />
          Kota
        </span>
      ) : null}

      {showBadge ? (
        <span
          className={`hidden xl:inline-flex items-center rounded-full text-[9px] font-black px-2 py-0.5 uppercase tracking-wider border shadow-xs ${
            isDark
              ? "bg-white/10 text-white border-white/20"
              : "bg-[#e8f5e9] text-[#0c831f] border-[#0c831f]/25"
          }`}
        >
          Fastest
        </span>
      ) : null}
    </Link>
  );
}

export default CentralMartLogo;
