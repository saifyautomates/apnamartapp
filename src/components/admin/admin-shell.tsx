"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Admin shell — preview design language: white sidebar + topbar on a soft
 * gray page, fresh green #15803d primary, charcoal text. Presentation only:
 * the auth gate stays in the server layout, and every nav target below is
 * the pre-existing admin route (same hrefs and labels as before).
 */

export type AdminNavItem = { href: string; label: string };

function Svg({ children, filled = false }: { children: React.ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function iconFor(href: string): React.ReactNode {
  switch (href) {
    case "/admin":
      return (
        <Svg>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </Svg>
      );
    case "/admin/orders":
      return (
        <Svg>
          <path d="M6 7h12l1.2 13.2a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 7Z" />
          <path d="M9 10V6a3 3 0 0 1 6 0v4" />
        </Svg>
      );
    case "/admin/products":
      return (
        <Svg>
          <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z" />
          <path d="M3 8.5 12 13l9-4.5" />
          <path d="M12 13v7" />
        </Svg>
      );
    case "/admin/categories":
      return (
        <Svg>
          <path d="M3 12V5a1 1 0 0 1 1-1h6l9 9-8 8-8-9Z" />
          <circle cx="8" cy="8" r="1.4" />
        </Svg>
      );
    case "/admin/inventory":
      return (
        <Svg>
          <path d="M12 3 21 8l-9 5-9-5 9-5Z" />
          <path d="M3 13l9 5 9-5" />
        </Svg>
      );
    case "/admin/customers":
      return (
        <Svg>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 19c.6-3 3.2-4.8 6.5-4.8s5.9 1.8 6.5 4.8" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M15.5 14.6c2.4.6 4 2 4.5 4.4" />
        </Svg>
      );
    case "/admin/offers":
      return (
        <Svg>
          <path d="M3 8.5h18V12a2.2 2.2 0 0 0 0 4.5v2H3v-2a2.2 2.2 0 0 0 0-4.5V8.5Z" />
          <path d="M13 8.5v10" strokeDasharray="2 2" />
        </Svg>
      );
    case "/admin/coupons":
      return (
        <Svg>
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <path d="M8 12h.01" strokeWidth="3" />
          <path d="M13 7v10" strokeDasharray="2 2" />
        </Svg>
      );
    case "/admin/delivery":
      return (
        <Svg>
          <rect x="2" y="7" width="12" height="9" rx="1" />
          <path d="M14 10h3.5L21 13.5V16h-7" />
          <circle cx="7" cy="18" r="1.8" />
          <circle cx="17" cy="18" r="1.8" />
        </Svg>
      );
    case "/admin/payments":
      return (
        <Svg>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </Svg>
      );
    case "/admin/loyalty":
      return (
        <Svg filled>
          <polygon points="12,3 15,9 21,9 16.5,13 18,19 12,15.5 6,19 7.5,13 3,9 9,9" />
        </Svg>
      );
    case "/admin/credit":
      return (
        <Svg>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <path d="M16 15h2.5" />
        </Svg>
      );
    case "/admin/reports":
      return (
        <Svg filled>
          <rect x="4" y="14" width="3.5" height="6" rx="1" />
          <rect x="10" y="10" width="3.5" height="10" rx="1" />
          <rect x="16" y="6" width="3.5" height="14" rx="1" />
        </Svg>
      );
    case "/admin/integrations":
      return (
        <Svg>
          <circle cx="9" cy="7" r="2.4" />
          <circle cx="15" cy="7" r="2.4" />
          <path d="M9 9.5V13M15 9.5V13M7 13h8v2.5A2.5 2.5 0 0 1 12.5 18h-1A2.5 2.5 0 0 1 9 15.5V13" />
        </Svg>
      );
    case "/admin/users":
      return (
        <Svg>
          <circle cx="10" cy="8" r="3.2" />
          <path d="M3 19c.6-3 3.2-4.8 7-4.8 1.3 0 2.5.2 3.5.7" />
          <circle cx="17.5" cy="15.5" r="2.2" />
          <path d="M17.5 13.8v-.4M17.5 17.6v-.4M15.8 15.5h-.4M19.6 15.5h-.4" />
        </Svg>
      );
    case "/admin/settings":
      return (
        <Svg>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8" />
        </Svg>
      );
    case "/admin/audit":
      return (
        <Svg>
          <path d="M7 3h7l4 4v14H7V3Z" />
          <path d="M9.5 12h6M9.5 16h6" />
        </Svg>
      );
    case "/admin/bulk":
      return (
        <Svg>
          <path d="M12 16V4M6.5 9.5 12 4l5.5 5.5" />
          <path d="M4 20h16" />
        </Svg>
      );
    default:
      return (
        <Svg>
          <circle cx="12" cy="12" r="8" />
        </Svg>
      );
  }
}

const BOTTOM_NAV = ["/admin", "/admin/orders", "/admin/products", "/admin/inventory"];

function NavList({ nav, pathname, onNavigate }: { nav: AdminNavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-1 text-sm">
      {nav.map((n) => {
        const active = n.href === "/admin" ? pathname === "/admin" : pathname === n.href || pathname.startsWith(`${n.href}/`);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors ${
              active ? "bg-admin text-white" : "text-ink hover:bg-adminbg"
            }`}
          >
            {iconFor(n.href)}
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({
  nav,
  storeName,
  monogram,
  children,
}: {
  nav: AdminNavItem[];
  storeName: string;
  monogram: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const labelByHref = new Map(nav.map((n) => [n.href, n.label]));

  return (
    <div className="flex min-h-screen bg-adminbg text-ink">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-adminline bg-white lg:flex">
        <div className="flex items-center gap-3 px-4 pb-4 pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-admin text-base font-extrabold text-white">
            {monogram}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-extrabold leading-tight">{storeName}</span>
            <span className="block text-xs text-muted">Admin panel</span>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavList nav={nav} pathname={pathname} />
        </div>
        <div className="border-t border-adminline p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-adminbg">
            ← Back to store
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-adminline bg-white/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg border border-adminline px-3 py-2 text-sm font-semibold lg:hidden"
            aria-label="Open admin menu"
          >
            ☰ Menu
          </button>
          <span className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin text-sm font-extrabold text-white">{monogram}</span>
            <span className="max-w-[160px] truncate text-sm font-bold">{storeName}</span>
          </span>
          <form method="get" action="/admin/products" role="search" className="mx-auto w-full max-w-md flex-1">
            <input
              name="q"
              type="search"
              placeholder="Search products, SKU, barcode…"
              className="w-full rounded-full border border-adminline bg-adminbg px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-admin"
            />
          </form>
          <span className="hidden shrink-0 items-center gap-2 rounded-full border border-adminline px-3 py-1.5 text-xs font-semibold text-muted sm:flex">
            <span className="h-2 w-2 rounded-full bg-admin" aria-hidden="true" />
            Admin
          </span>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 pb-4 pt-5">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin text-base font-extrabold text-white">{monogram}</span>
                <span>
                  <span className="block font-extrabold leading-tight">{storeName}</span>
                  <span className="block text-xs text-muted">Admin panel</span>
                </span>
              </span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg border border-adminline px-3 py-1.5 text-sm font-semibold" aria-label="Close menu">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <NavList nav={nav} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-adminline p-3">
              <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-medium text-muted" onClick={() => setDrawerOpen(false)}>
                ← Back to store
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile bottom nav */}
      <nav aria-label="Admin shortcuts" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-adminline bg-white lg:hidden">
        {BOTTOM_NAV.map((href) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-admin" : "text-muted"}`}
            >
              {iconFor(href)}
              {labelByHref.get(href) ?? href}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
