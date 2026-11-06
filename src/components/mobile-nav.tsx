"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPaise } from "@/lib/money";

export default function MobileBottomNav() {
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
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Categories", href: "/category", icon: "🍱" },
    { label: "Search", href: "/search", icon: "🔍" },
    { label: "Orders", href: "/orders", icon: "📦" },
    { label: "Account", href: "/account", icon: "👤" },
  ];

  return (
    <div className="sm:hidden">
      {/* Floating Cart Bar (appears when items > 0 and not on checkout) */}
      {count > 0 && !pathname.startsWith("/checkout") ? (
        <div className="fixed bottom-16 left-3 right-3 z-40 animate-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={openCart}
            className="w-full flex items-center justify-between bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-600 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-800/80 text-sm">
                🛒
              </span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-bold opacity-90">{count} {count === 1 ? "item" : "items"}</p>
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
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 px-2 py-1 shadow-lg flex justify-around items-center"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-center transition ${
                isActive ? "text-emerald-700 font-extrabold" : "text-slate-500 font-medium hover:text-slate-800"
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{item.icon}</span>
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

