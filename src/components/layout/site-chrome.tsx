"use client";

import { usePathname } from "next/navigation";
import { InstallBanner } from "@/components/pwa";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ProductDetailModal } from "@/components/product/product-detail-modal";
import { SearchModal } from "@/components/search/search-modal";
import { LoginModal } from "@/components/auth/login-modal";
import { CategoryDrawer } from "@/components/category/category-drawer";
import { MobileBottomNav } from "./mobile-nav";
import { SiteFooter } from "./footer";
import { AdminQuickSwitch } from "./admin-quick-switch";
import { ActiveOrderPill } from "./active-order-pill";

export function SiteChrome({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfcfc]">
      <InstallBanner />
      {header}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 py-2.5 sm:py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-12">
        {children}
      </main>

      {/* In-App Native App Modals (Everything opens on the SAME page) */}
      <CartDrawer />
      <ProductDetailModal />
      <SearchModal />
      <LoginModal />
      <CategoryDrawer />

      {/* Floating Active Delivery Live Tracking Pill */}
      <ActiveOrderPill />

      {/* Mobile Floating Cart & Bottom Nav */}
      <MobileBottomNav />

      {/* Floating 1-Click Admin Access Switcher */}
      <AdminQuickSwitch />

      {/* Modern Blinkit Footer */}
      <SiteFooter />
    </div>
  );
}

export default SiteChrome;

