"use client";

import Link from "next/link";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}

export function CentralMartLogo({
  className = "",
  size = "md",
  showBadge = false,
}: LogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-3xl sm:text-4xl",
    lg: "text-4xl sm:text-5xl",
  };

  return (
    <Link
      href="/"
      className={`group flex items-center gap-2 select-none relative focus:outline-none ${className}`}
      aria-label="Central Mart Home"
    >
      {/* 3D Modern Delivery Cart Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#0c831f] to-[#16a34a] shadow-sm flex items-center justify-center text-white transform group-hover:scale-110 group-hover:rotate-[-4deg] transition-all duration-300">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          {/* Lightning Accent Badge */}
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#f8cb46] text-[#1c1c1c] text-[10px] font-black flex items-center justify-center shadow-sm animate-bounce">
            ⚡
          </span>
        </div>
      </div>

      {/* Brand Wordmark with Shimmer */}
      <div className="flex flex-col leading-none">
        <div className={`font-black tracking-tight font-sans ${sizeClasses[size]}`}>
          <span className="text-[#f8cb46] group-hover:brightness-105 transition-all">central</span>
          <span className="text-[#0c831f] group-hover:brightness-105 transition-all">mart</span>
        </div>
        <span className="text-[9px] font-extrabold tracking-widest uppercase text-neutral-400 group-hover:text-[#0c831f] transition-colors -mt-0.5">
          8 Mins Delivery
        </span>
      </div>

      {showBadge ? (
        <span className="hidden lg:inline-flex items-center rounded-full bg-[#e8f5e9] text-[#0c831f] text-[10px] font-black px-2 py-0.5 uppercase tracking-wider border border-[#0c831f]/20">
          Instant
        </span>
      ) : null}
    </Link>
  );
}

export default CentralMartLogo;
