"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { CentralMartLogo } from "@/components/ui/logo";

export type AdminNavItem = { href: string; label: string; badge?: string | number };

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
    case "/admin/pos":
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
  { href: "/admin/pos", label: "BUSY POS", badge: "Sync" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/delivery", label: "Delivery" },
  { href: "/admin/banners", label: "Banners", badge: "Live" },
  { href: "/admin/bulk", label: "Bulk Ops" },
  { href: "/admin/offers", label: "Reviews", badge: 18 },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

const SEARCH_LINKS = [
  { title: "Store Dashboard", category: "Navigation", href: "/admin", icon: "📊" },
  { title: "Live Orders & Processing", category: "Navigation", href: "/admin/orders", icon: "📦" },
  { title: "BUSY Counter POS Terminal", category: "POS & Billing", href: "/admin/pos", icon: "🏪" },
  { title: "Catalog Products & Barcodes", category: "Catalog", href: "/admin/products", icon: "🏷️" },
  { title: "Product Categories", category: "Catalog", href: "/admin/categories", icon: "📁" },
  { title: "Inventory & Low Stock", category: "Catalog", href: "/admin/inventory", icon: "📉" },
  { title: "Customer Database", category: "CRM", href: "/admin/customers", icon: "👥" },
  { title: "Coupons & Discounts", category: "Marketing", href: "/admin/coupons", icon: "🎟️" },
  { title: "Delivery Radius & Slots", category: "Operations", href: "/admin/delivery", icon: "🚚" },
  { title: "Storefront Banners & Sale Promotions", category: "Marketing", href: "/admin/banners", icon: "🎨" },
  { title: "Store Settings & Super Admin", category: "Settings", href: "/admin/settings", icon: "⚙️" },
  { title: "Recent Order #ORD-20261107-0037", category: "Recent Orders", href: "/admin/orders", icon: "🧾" },
  { title: "BUSY Counter Bill #POS638367", category: "Recent POS", href: "/admin/pos", icon: "🧾" },
  { title: "Amul Taaza Fresh Milk 500ml", category: "Top Products", href: "/admin/products", icon: "🥛" },
  { title: "Fortune Sunlite Sunflower Oil 1L", category: "Top Products", href: "/admin/products", icon: "🌻" },
  { title: "Aashirvaad Shudh Chakki Atta 5kg", category: "Top Products", href: "/admin/products", icon: "🌾" },
];

const NOTIFICATIONS = [
  {
    id: "1",
    title: "New Online Order Placed",
    desc: "Order #ORD-20261107-0037 received for ₹1,595 via UPI",
    time: "4 mins ago",
    unread: true,
    icon: "🛍️",
  },
  {
    id: "2",
    title: "BUSY POS Counter Synced",
    desc: "Terminal 01 synced 42 counter bills (₹1,61,680)",
    time: "18 mins ago",
    unread: true,
    icon: "🏪",
  },
  {
    id: "3",
    title: "Low Stock Warning",
    desc: "Fortune Oil 1L inventory is down to 4 units",
    time: "1 hour ago",
    unread: false,
    icon: "⚠️",
  },
  {
    id: "4",
    title: "Delivery Completed",
    desc: "Order #ORD-20261107-0034 delivered in 14 minutes",
    time: "2 hours ago",
    unread: false,
    icon: "✅",
  },
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
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [greeting, setGreeting] = useState("Good Evening, Admin 👋");

  // Interactive UI Dropdowns & Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning, Admin 👋");
    else if (hour < 17) setGreeting("Good Afternoon, Admin 👋");
    else setGreeting("Good Evening, Admin 👋");

    // Global Ctrl+K / Cmd+K listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLinks = SEARCH_LINKS.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    // Clear cookies & redirect
    document.cookie = "gcp_admin_token=; path=/; max-age=0";
    document.cookie = "gcp_session=; path=/; max-age=0";
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f3f6f4] text-[#1c1c1c] font-sans antialiased">
      {/* 1. Desktop Dark Forest Green Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-68 shrink-0 flex-col bg-gradient-to-b from-[#052b14] via-[#063319] to-[#04200f] text-white shadow-2xl lg:flex z-40 border-r border-emerald-950/40">
        {/* Brand Header */}
        <div className="px-5 py-4.5 border-b border-white/10">
          <CentralMartLogo
            theme="dark"
            size="sm"
            subtitle="Online Grocery Store · Kota"
            href="/admin"
            showKotaBadge={false}
          />
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
                  <span>BUSY POS Live Sync</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#a3e635]">✓</span>
                  <span>Instant Barcode Listing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#a3e635]">✓</span>
                  <span>Smart Location Delivery</span>
                </li>
              </ul>
            </div>
            <div className="absolute -bottom-6 -right-6 text-6xl opacity-20 pointer-events-none select-none">
              🍃
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className={`sticky top-0 z-30 ${pathname.startsWith("/admin/pos") ? "hidden lg:flex" : "flex"} items-center justify-between gap-4 border-b border-neutral-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-md shadow-xs`}>
          {/* Left Greeting */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-neutral-200 p-2 text-sm font-bold lg:hidden text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-[#1c1c1c] tracking-tight leading-none">
                {greeting}
              </h1>
              <p className="text-xs text-neutral-500 font-medium mt-0.5 hidden sm:block">
                Here&apos;s what&apos;s happening across Central Mart today.
              </p>
            </div>
          </div>

          {/* Center Search Bar with Ctrl+K trigger */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full relative flex items-center justify-between rounded-full border border-neutral-200/90 bg-[#f8faf9] hover:bg-white hover:border-[#0c831f] pl-10 pr-3 py-2 text-xs font-semibold text-neutral-400 shadow-inner transition cursor-pointer text-left group"
            >
              <span className="absolute left-3.5 text-neutral-400 group-hover:text-[#0c831f] transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <span>Search products, orders, POS slips, settings…</span>
              <span className="rounded-md bg-neutral-200/80 px-2 py-0.5 text-[10px] font-black text-neutral-600">
                Ctrl K
              </span>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger for Mobile */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
              title="Search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notification Bell with Interactive Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition active:scale-95 cursor-pointer"
                title="Notifications"
                aria-expanded={notifOpen}
              >
                <span className="text-sm">🔔</span>
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                ) : null}
              </button>

              {notifOpen ? (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#1c1c1c]">Store Notifications</span>
                      {unreadCount > 0 ? (
                        <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-black">
                          {unreadCount} new
                        </span>
                      ) : null}
                    </div>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setUnreadCount(0)}
                        className="text-xs font-bold text-[#0c831f] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>

                  <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto py-1">
                    {NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 py-2.5 px-1.5 rounded-xl transition ${
                          n.unread && unreadCount > 0 ? "bg-emerald-50/50" : "hover:bg-neutral-50"
                        }`}
                      >
                        <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-[#1c1c1c] leading-snug">{n.title}</p>
                          <p className="text-[11px] font-medium text-neutral-600 truncate mt-0.5">{n.desc}</p>
                          <span className="text-[10px] font-semibold text-neutral-400 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-neutral-100 text-center">
                    <Link
                      href="/admin/orders"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-black text-[#0c831f] hover:underline block"
                    >
                      View All Live Activity →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Link to Customer Storefront */}
            <Link
              href="/"
              target="_blank"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-[#e8f5e9] hover:text-[#0c831f] text-neutral-700 transition active:scale-95 cursor-pointer"
              title="Open Customer Storefront (New Tab)"
            >
              <span className="text-sm">🏪</span>
            </Link>

            {/* Admin User Profile Pill with Interactive Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-50 pl-1.5 pr-3 py-1 shadow-xs transition active:scale-95 cursor-pointer"
                aria-expanded={profileOpen}
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#0c831f] to-[#22c55e] flex items-center justify-center text-white text-xs font-black shadow-xs">
                  👑
                </div>
                <div className="flex flex-col text-left leading-none hidden sm:flex">
                  <span className="text-xs font-black text-[#1c1c1c]">Super Admin</span>
                  <span className="text-[10px] font-bold text-emerald-700">OWNER · Full Rights</span>
                </div>
                <span className="text-[10px] text-neutral-400">▾</span>
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-2 border-b border-neutral-100">
                    <div className="text-xs font-black text-[#1c1c1c]">jackxparrowww@gmail.com</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e]" />
                      <span className="text-[10px] font-black text-[#0c831f] uppercase tracking-wider">
                        Master Administrator (24/24)
                      </span>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <Link
                      href="/admin/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-[#0c831f] transition cursor-pointer"
                    >
                      <span>⚙️</span>
                      <span>Store Settings</span>
                    </Link>
                    <Link
                      href="/admin/pos"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-[#0c831f] transition cursor-pointer"
                    >
                      <span>🏪</span>
                      <span>BUSY POS Terminal Hub</span>
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-[#0c831f] transition cursor-pointer"
                    >
                      <span>🌐</span>
                      <span>Customer Storefront</span>
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-black text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <span>🚪</span>
                      <span>Log Out of Admin</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page Main Content Area: Gracefully fluid without cramped centering */}
        <main className={`flex-1 w-full max-w-[1920px] mx-auto pb-24 lg:pb-6 ${pathname.startsWith("/admin/pos") ? "p-0 lg:px-8 lg:py-6" : "px-4 sm:px-6 lg:px-8 py-6"}`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar matching Central Mart World-Class Mobile Spec */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition ${
              pathname === "/admin"
                ? "text-[#0c831f] font-black"
                : "text-neutral-500 font-semibold hover:text-neutral-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={pathname === "/admin" ? "2.5" : "2"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            href="/admin/pos"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition ${
              pathname.startsWith("/admin/pos")
                ? "text-[#0c831f] font-black"
                : "text-neutral-500 font-semibold hover:text-neutral-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={pathname.startsWith("/admin/pos") ? "2.5" : "2"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-[10px]">POS</span>
          </Link>

          <Link
            href="/admin/orders"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition ${
              pathname.startsWith("/admin/orders")
                ? "text-[#0c831f] font-black"
                : "text-neutral-500 font-semibold hover:text-neutral-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={pathname.startsWith("/admin/orders") ? "2.5" : "2"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-[10px]">Orders</span>
          </Link>

          <Link
            href="/admin/products"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition ${
              pathname.startsWith("/admin/products")
                ? "text-[#0c831f] font-black"
                : "text-neutral-500 font-semibold hover:text-neutral-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={pathname.startsWith("/admin/products") ? "2.5" : "2"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[10px]">Products</span>
          </Link>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-neutral-500 font-semibold hover:text-neutral-900 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="text-[10px]">More</span>
          </button>
        </nav>
      </div>

      {/* Global Command Palette (Ctrl+K Modal) */}
      {searchOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-neutral-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-200">
              <span className="text-neutral-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, orders, POS bills, or settings…"
                className="w-full text-sm font-semibold text-[#1c1c1c] placeholder-neutral-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-lg bg-neutral-100 px-2 py-1 text-xs font-black text-neutral-500 hover:bg-neutral-200 cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Quick Links / Search Results */}
            <div className="max-h-80 overflow-y-auto p-3 space-y-1">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-[#e8f5e9] hover:text-[#0c831f] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-bold text-neutral-400">
                  No matching items found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
              <span>Tip: Press <strong>ESC</strong> to exit</span>
              <span>Fast Omnichannel Navigation</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile Drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#052b14] to-[#04200f] text-white p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <CentralMartLogo
                theme="dark"
                size="xs"
                subtitle="Online Grocery Store · Kota"
                href="/admin"
                showKotaBadge={false}
              />
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
