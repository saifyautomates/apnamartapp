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
  if (activeLogo && !imgError) {
    if (activeMode === "IMAGE_ONLY") {
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

    // IMAGE_AND_TEXT mode: icon alongside wordmark
    return (
      <Link
        href={href}
        className={`group inline-flex items-center gap-2 select-none relative focus:outline-hidden transition-transform active:scale-95 ${className}`}
        aria-label={activeName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeLogo}
          alt={activeName}
          onError={() => setImgError(true)}
          className={`${
            size === "xs"
              ? "h-6 w-6"
              : size === "sm"
              ? "h-7 w-7"
              : size === "lg"
              ? "h-9 w-9"
              : size === "xl"
              ? "h-12 w-12"
              : "h-8 w-8"
          } object-contain shrink-0`}
        />
        <div className="flex flex-col leading-none">
          <span
            className={`font-black tracking-tight ${
              isGreenHeader
                ? "text-white text-lg sm:text-xl"
                : isDark
                ? "text-white text-lg"
                : size === "xs"
                ? "text-base text-[#166534]"
                : size === "sm"
                ? "text-lg text-[#166534]"
                : size === "lg"
                ? "text-2xl text-[#166534]"
                : "text-xl sm:text-2xl text-[#166534]"
            }`}
          >
            {activeName}
          </span>
          {subtitle && (
            <span
              className={`text-[10px] font-semibold tracking-wide mt-0.5 ${
                isGreenHeader ? "text-emerald-100" : isDark ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      </Link>
    );
  }

  // Fallback to signature Central Mart Bag + Leaf Emblem SVG and Wordmark
  const nameParts = activeName.split(" ");
  const firstWord = nameParts[0] || "Central";
  const restWords = nameParts.slice(1).join(" ") || "Mart";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 select-none relative focus:outline-hidden transition-transform active:scale-95 ${className}`}
      aria-label={`${activeName} - Daily Essentials • Best Prices • Fast Delivery`}
    >
      {/* Signature Shopping Cart / Bag Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        {isGreenHeader ? (
          <div className="h-7 w-7 rounded-xl bg-lime-400/20 flex items-center justify-center text-base shadow-xs border border-lime-300/30">
            <svg className="w-5 h-5 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        ) : (
          <svg
            className={
              size === "xs"
                ? "w-6 h-6"
                : size === "sm"
                ? "w-7 h-7"
                : size === "lg"
                ? "w-10 h-10"
                : "w-8 h-8"
            }
            viewBox="0 0 40 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bag Handle */}
            <path
              d="M13 14C13 10.134 16.134 7 20 7C23.866 7 27 10.134 27 14"
              stroke="#0c831f"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Bag Body with rounded corners */}
            <rect x="6" y="12" width="28" height="26" rx="6" fill="#0c831f" />
            {/* Stylized White Leaf cut-out inside bag */}
            <path
              d="M20 18C16 18 13 21 13 25C13 29 17 31 21 30C25 29 27 25 27 21C27 19 23 18 20 18Z"
              fill="white"
            />
            {/* Leaf Midrib Line */}
            <path
              d="M14.5 28.5C18 26 21 23 25 19.5"
              stroke="#0c831f"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Brand Wordmark & Tagline */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center">
          <span
            className={`font-black tracking-tight ${
              isGreenHeader
                ? "text-white text-lg sm:text-xl"
                : isDark
                ? "text-white text-lg"
                : size === "xs"
                ? "text-base text-[#166534]"
                : size === "sm"
                ? "text-lg text-[#166534]"
                : size === "lg"
                ? "text-2xl text-[#166534]"
                : "text-xl sm:text-2xl text-[#166534]"
            }`}
          >
            {firstWord}{" "}
            <span className={isGreenHeader ? "text-lime-300" : "relative text-[#0c831f]"}>
              {restWords}
              {!isGreenHeader && (
                <svg
                  className="absolute -bottom-1 left-0 w-full h-1.5"
                  viewBox="0 0 48 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 2C14 6.5 34 6.5 46 2"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
          </span>
        </div>

        {isGreenHeader ? (
          <span className="text-[9px] text-emerald-100 font-semibold tracking-tight mt-0.5">
            Daily Essentials • Best Prices • Fast Delivery
          </span>
        ) : subtitle ? (
          <span className="text-[10px] text-neutral-400 font-semibold tracking-wide mt-0.5">
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default CentralMartLogo;
