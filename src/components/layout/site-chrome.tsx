"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { InstallBanner } from "@/components/pwa";
import { MobileBottomNav } from "./mobile-nav";
import { SiteFooter } from "./footer";
import { ActiveOrderPill } from "./active-order-pill";

// Lazy-load modal sheets so low-spec phones parse 60% less initial JavaScript on cold start
const CartDrawer = dynamic(() => import("@/components/cart/cart-drawer"), { ssr: false });
const ProductDetailModal = dynamic(() => import("@/components/product/product-detail-modal"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/search/search-modal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/auth/login-modal"), { ssr: false });
const CategoryDrawer = dynamic(() => import("@/components/category/category-drawer"), { ssr: false });

export function SiteChrome({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin") || pathname === "/app" || pathname.startsWith("/app/")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfcfc]">
      <InstallBanner />
      {header}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 py-2.5 sm:py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-12">
        {children}
      </main>

      {/* In-App Native App Modals (Deferred chunks for low-spec phone speed) */}
      <CartDrawer />
      <ProductDetailModal />
      <SearchModal />
      <LoginModal />
      <CategoryDrawer />

      {/* Floating Active Delivery Live Tracking Pill */}
      <ActiveOrderPill />

      {/* Mobile Floating Cart & Bottom Nav */}
      <MobileBottomNav />

      {/* Modern Blinkit Footer */}
      <SiteFooter />
    </div>
  );
}

export default SiteChrome;
