"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { InstallBanner, InstallAppLink } from "@/components/pwa";
import CartDrawer from "@/components/cart-drawer";
import MobileBottomNav from "@/components/mobile-nav";

export default function SiteChrome({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <InstallBanner />
      {header}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 py-4 pb-28 sm:pb-12">
        {children}
      </main>

      {/* Slide-over Cart Drawer (accessible globally from header & cards) */}
      <CartDrawer />

      {/* Mobile Floating Cart & Bottom Nav */}
      <MobileBottomNav />

      {/* Modern Blinkit Footer */}
      <footer className="border-t border-slate-200/80 bg-white hidden sm:block">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-2xl font-black tracking-tight text-ink">
                  blink<span className="text-emerald-700">it</span>
                </span>
                <span className="rounded-full bg-amber-400 text-ink px-2 py-0.5 text-[10px] font-black uppercase">
                  10 mins
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                India&apos;s last minute app. Delivering groceries, fresh staples, dairy, snacks, and household essentials in 10 minutes.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black text-ink uppercase tracking-wider mb-3">Categories</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li><Link href="/category/dairy-eggs" className="hover:text-emerald-700">Dairy & Eggs</Link></li>
                <li><Link href="/category/staples" className="hover:text-emerald-700">Atta, Rice & Dal</Link></li>
                <li><Link href="/category/snacks" className="hover:text-emerald-700">Snacks & Munchies</Link></li>
                <li><Link href="/category/beverages" className="hover:text-emerald-700">Cold Drinks & Juices</Link></li>
                <li><Link href="/category/household" className="hover:text-emerald-700">Cleaning Essentials</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-ink uppercase tracking-wider mb-3">Customer Service</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li><Link href="/orders" className="hover:text-emerald-700">My Orders</Link></li>
                <li><Link href="/account" className="hover:text-emerald-700">My Profile</Link></li>
                <li><Link href="/cart" className="hover:text-emerald-700">View Cart</Link></li>
                <li><Link href="/staff-login" className="hover:text-emerald-700">Staff & Admin Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-ink uppercase tracking-wider mb-3">Why Shop With Us?</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-amber-500 font-bold">⚡</span>
                  <span className="font-semibold text-ink">Superfast 10 Mins Delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">🏷️</span>
                  <span>Best Prices & Daily Offers</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold">💯</span>
                  <span>100% Genuine Branded Products</span>
                </li>
              </ul>
              <div className="mt-4">
                <InstallAppLink />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
            <p>© {new Date().getFullYear()} Blinkit Clone · Powered by Grocery Commerce Platform.</p>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-ink">Accepted Payments:</span>
              <span>UPI · Cards · Cash on Delivery</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
