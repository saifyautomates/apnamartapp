"use client";

import { useState } from "react";
import Link from "next/link";
import { useBranding } from "@/lib/branding-context";

export interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  showKotaBadge?: boolean;
  subtitle?: string;
  theme?: "light" | "dark" | "greenHeader";
  href?: string;
  logoUrl?: string;
  storeName?: string;
  displayMode?: "IMAGE_ONLY" | "IMAGE_AND_TEXT";
}

export function CentralMartLogo({
  className = "",
  size = "md",
  showBadge = false,
  showKotaBadge = false,
  subtitle,
  theme = "light",
  href = "/",
  logoUrl,
  storeName,
  displayMode,
}: LogoProps) {
  const isGreenHeader = theme === "greenHeader";
  const isDark = theme === "dark";
  const branding = useBranding();

  const activeLogo = logoUrl !== undefined ? logoUrl : branding.logoUrl;
  const activeName = storeName || branding.name || "Central Mart";
  const activeMode = displayMode || branding.displayMode || "IMAGE_ONLY";

  const [imgError, setImgError] = useState(false);

  // If a custom image logo is configured and hasn't failed to load:
  if (activeLogo && !imgError && activeMode === "IMAGE_ONLY") {
    return (
      <Link
        href={href}
        className={`group inline-flex items-center select-none relative focus:outline-hidden transition-transform active:scale-95 ${className}`}
        aria-label={activeName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeLogo}
          alt={activeName}
          onError={() => setImgError(true)}
          className={`${
            size === "xs"
              ? "h-6 max-w-[130px]"
              : size === "sm"
              ? "h-7 max-w-[150px]"
              : size === "lg"
              ? "h-10 sm:h-11 max-w-[220px]"
              : size === "xl"
              ? "h-13 sm:h-14 max-w-[280px]"
              : "h-8 sm:h-9 max-w-[180px]"
          } w-auto object-contain shrink-0`}
        />
      </Link>
    );
  }

  // Exact Central Mart Logo matching design mockup:
  // Speed-motion line shopping cart in vibrant lime green + Central Mart wordmark + "Smart Shopping. Better Living."
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 select-none relative focus:outline-hidden transition-transform active:scale-95 ${className}`}
      aria-label={`${activeName} - Smart Shopping. Better Living.`}
    >
      {/* Signature Speed-Cart Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          className={`${
            size === "xs"
              ? "w-6 h-6"
              : size === "sm"
              ? "w-7 h-7"
              : size === "lg"
              ? "w-10 h-10"
              : size === "xl"
              ? "w-12 h-12"
              : "w-8 h-8"
          } text-lime-400 drop-shadow-xs`}
          viewBox="0 0 40 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speed Motion Lines */}
          <path d="M4 11h6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M2 17h8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M4 23h6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          {/* Shopping Cart Body */}
          <path
            d="M13.5 11h4.5l3.2 12h12.5l3.5-9H18"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Wheels */}
          <circle cx="22.5" cy="27.5" r="2.5" fill="currentColor" />
          <circle cx="31.5" cy="27.5" r="2.5" fill="currentColor" />
        </svg>
      </div>

      {/* Brand Wordmark & Tagline */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center">
          <span
            className={`font-black tracking-tight ${
              isGreenHeader || isDark
                ? "text-white"
                : "text-neutral-900"
            } ${
              size === "xs"
                ? "text-base"
                : size === "sm"
                ? "text-lg"
                : size === "lg"
                ? "text-2xl"
                : size === "xl"
                ? "text-3xl"
                : "text-xl sm:text-2xl"
            }`}
          >
            Central{" "}
            <span className={isGreenHeader || isDark ? "text-lime-400" : "text-[#0c831f]"}>
              Mart
            </span>
          </span>
        </div>

        <span
          className={`text-[9px] font-bold tracking-tight mt-0.5 ${
            isGreenHeader || isDark ? "text-emerald-100/90" : "text-neutral-500"
          }`}
        >
          {subtitle || "Smart Shopping. Better Living."}
        </span>
      </div>
    </Link>
  );
}

export default CentralMartLogo;
