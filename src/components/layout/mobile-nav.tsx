"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPaise } from "@/lib/money";

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCount(json.data.count ?? 0);
          setTotal(json.data.subtotalPaise ?? 0);
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, []);

  const openCart = () => {
    window.dispatchEvent(new Event("open-cart"));
  };

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Categories",
      href: "/category",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      label: "Search",
      href: "/search",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: "Orders",
      href: "/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Account",
      href: "/account",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="sm:hidden">
      {/* Blinkit Floating Cart Pill (pops up above bottom nav when items > 0) */}
      {count > 0 && !pathname.startsWith("/checkout") ? (
        <div className="fixed bottom-16 left-3 right-3 z-40 animate-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={openCart}
            className="w-full flex items-center justify-between bg-[#0c831f] hover:bg-[#0a701a] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-[#0c831f] transition active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-sm">
                🛒
              </span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-bold opacity-90">
                  {count} {count === 1 ? "item" : "items"}
                </p>
                <p className="text-sm font-black">{formatPaise(total)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-xl">
              <span>View Cart</span>
              <span>→</span>
            </div>
          </button>
        </div>
      ) : null}

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200/80 px-2 py-1 shadow-lg flex justify-around items-center"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-center transition ${
                isActive ? "text-[#0c831f] font-black" : "text-neutral-500 font-medium hover:text-neutral-800"
              }`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span className="text-[10px] leading-tight font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default MobileBottomNav;

