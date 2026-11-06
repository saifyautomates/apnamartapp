"use client";

import { formatPaise } from "@/lib/money";

export interface CartButtonProps {
  count: number;
  total: number;
  onClick: () => void;
  className?: string;
}

export function CartHeaderButton({
  count,
  total,
  onClick,
  className = "",
}: CartButtonProps) {
  const hasItems = count > 0;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-extrabold transition active:scale-95 cursor-pointer ${
        hasItems
          ? "bg-[#0c831f] hover:bg-[#0a701a] text-white shadow-sm ring-2 ring-[#0c831f]/20"
          : "bg-[#f2f4f7] hover:bg-[#e5e7eb] text-[#6b7280]"
      } ${className}`}
      aria-label="Open Cart"
    >
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.3"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {hasItems ? (
        <div className="flex flex-col text-left leading-none">
          <span className="text-[10px] font-bold opacity-90">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{formatPaise(total)}</span>
        </div>
      ) : (
        <span className="font-bold">My Cart</span>
      )}
    </button>
  );
}

export default CartHeaderButton;
