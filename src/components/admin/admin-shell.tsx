"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export type AdminNavItem = { href: string; label: string; badge?: string | number };

function SvgIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function getIcon(href: string): React.ReactNode {
  switch (href) {
    case "/admin":
      return (
        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      );
    case "/admin/orders":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case "/admin/products":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "/admin/categories":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "/admin/inventory":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "/admin/customers":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "/admin/coupons":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case "/admin/delivery":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case "/admin/bulk":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "/admin/offers":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "/admin/reports":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "/admin/settings":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

const SIDEBAR_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders", badge: 24 },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/delivery", label: "Delivery" },
  { href: "/admin/bulk", label: "Banners" },
  { href: "/admin/offers", label: "Reviews", badge: 18 },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({
  children,
}: {
  nav?: AdminNavItem[];
  storeName?: string;
  monogram?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [greeting, setGreeting] = useState("Good Evening, Admin 👋");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning, Admin 👋");
    else if (hour < 17) setGreeting("Good Afternoon, Admin 👋");
    else setGreeting("Good Evening, Admin 👋");
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f3f6f4] text-[#1c1c1c] font-sans antialiased">
      {/* 1. Desktop Dark Forest Green Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-68 shrink-0 flex-col bg-gradient-to-b from-[#052b14] via-[#063319] to-[#04200f] text-white shadow-2xl lg:flex z-40 border-r border-emerald-950/40">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white shadow-md ring-2 ring-emerald-400/30">
            <span className="text-xl">🛒</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              Central Mart
              <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
            </span>
            <span className="text-[11px] font-semibold text-[#86efac]">Online Grocery Store</span>
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 custom-scrollbar">
          {SIDEBAR_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-emerald-900/40 font-black scale-[1.02]"
                    : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={active ? "text-white" : "text-emerald-400 group-hover:text-white"}>
                    {getIcon(item.href)}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                      active
                        ? "bg-white text-[#16a34a]"
                        : "bg-[#a3e635] text-[#052e16] shadow-xs"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Bottom Sidebar Promo Widget: Grow Your Mart Business */}
        <div className="p-3.5 border-t border-white/10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/12 to-white/5 p-4 border border-white/15 backdrop-blur-md shadow-inner text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-black text-white">
                <span>🌱</span>
                <span>Grow Your Mart Business</span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] font-bold text-emerald-100/90">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#a3e635]">✓</span>
                  <span>Track Sales & Profit</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#a3e635]">✓</span>
                  <span>Manage Inventory</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#a3e635]">✓</span>
                  <span>Handle Deliveries</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#a3e635]">✓</span>
                  <span>Grow Online Orders</span>
                </li>
              </ul>
            </div>
            {/* Background Leaf Accent */}
            <div className="absolute -bottom-6 -right-6 text-6xl opacity-20 pointer-events-none select-none">
              🍃
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar matching exact screenshot */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-neutral-200/80 bg-white/95 px-5 sm:px-8 py-3.5 backdrop-blur-md shadow-xs">
          {/* Left Greeting */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-neutral-200 p-2 text-sm font-bold lg:hidden text-neutral-700"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#1c1c1c] tracking-tight leading-none">
                {greeting}
              </h1>
              <p className="text-xs text-neutral-500 font-medium mt-0.5 hidden sm:block">
                Here&apos;s what&apos;s happening at Central Mart today.
              </p>
            </div>
          </div>

          {/* Center Search Bar with Ctrl K */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full flex items-center">
              <span className="absolute left-3.5 text-neutral-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search for products, orders, customers…"
                className="w-full rounded-full border border-neutral-200/90 bg-[#f8faf9] pl-10 pr-16 py-2 text-xs font-semibold text-[#1c1c1c] placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition shadow-inner"
              />
              <span className="absolute right-3 rounded-md bg-neutral-200/80 px-1.5 py-0.5 text-[10px] font-black text-neutral-600">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
              title="Notifications"
            >
              <span className="text-sm">🔔</span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Quick Link to Customer Storefront */}
            <Link
              href="/"
              target="_blank"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] text-neutral-700 transition cursor-pointer"
              title="Open Customer Storefront"
            >
              <span className="text-sm">🏪</span>
            </Link>

            {/* Admin User Profile Pill */}
            <div className="flex items-center gap-2.5 rounded-full border border-neutral-200/90 bg-neutral-50 pl-1.5 pr-3 py-1 shadow-xs">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#0c831f] to-[#22c55e] flex items-center justify-center text-white text-xs font-black shadow-xs">
                👤
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-xs font-black text-[#1c1c1c]">Admin User</span>
                <span className="text-[10px] font-medium text-neutral-400">Store Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-7 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#052b14] to-[#04200f] text-white p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-base font-black text-white">Central Mart Admin</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-white/10"
                >
                  <div className="flex items-center gap-2.5">
                    {getIcon(item.href)}
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="rounded-full bg-[#a3e635] text-[#052e16] px-2 py-0.5 text-[10px] font-black">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-white/10">
              <Link
                href="/"
                className="block text-center rounded-xl bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20"
              >
                ← Back to Storefront
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
