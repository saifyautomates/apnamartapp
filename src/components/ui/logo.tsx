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
  showKotaBadge = false,
  subtitle,
  theme = "light",
  href = "/",
}: LogoProps) {
  const isDark = theme === "dark";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 select-none relative focus:outline-hidden transition-transform active:scale-95 ${className}`}
      aria-label="Central Mart - Your Everyday Grocery Partner"
    >
      {/* Signature Shopping Bag with Leaf Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
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
          <rect
            x="6"
            y="12"
            width="28"
            height="26"
            rx="6"
            fill="#0c831f"
          />
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
      </div>

      {/* Brand Wordmark & Smile Curve */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center">
          <span
            className={`font-black tracking-tight text-[#166534] ${
              size === "xs"
                ? "text-base"
                : size === "sm"
                ? "text-lg"
                : size === "lg"
                ? "text-2xl"
                : "text-xl sm:text-2xl"
            }`}
          >
            Central{" "}
            <span className="relative text-[#0c831f]">
              Mart
              {/* Green Smile Curve Underneath "Mart" */}
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
            </span>
          </span>
        </div>

        {subtitle && (
          <span className="text-[10px] text-neutral-400 font-semibold tracking-wide mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
}

export default CentralMartLogo;
