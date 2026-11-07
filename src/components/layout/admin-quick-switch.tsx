"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Floating Quick-Access Switcher to the Central Mart Admin Portal.
 * Gives the store owner instant 1-click access to the Admin Dashboard
 * directly from anywhere on the website.
 */
export function AdminQuickSwitch() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin")) return null;

  return (
    <aside className="hidden sm:block fixed bottom-6 right-6 z-40 select-none print:hidden">
      <Link
        href="/admin"
        className="flex items-center gap-2 rounded-full bg-[#1c1c1c]/95 hover:bg-[#0c831f] text-white px-3.5 py-2 text-xs font-black shadow-2xl border border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
        aria-label="Direct Access to Store Admin Panel"
        title="Direct Store Administration (Products, Inventory, Orders, Settings)"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f8cb46] text-[#1c1c1c] text-[10px] font-black group-hover:rotate-45 transition-transform shadow-xs">
          ⚡
        </span>
        <span className="tracking-wide">Admin Portal</span>
      </Link>
    </aside>
  );
}

export default AdminQuickSwitch;

