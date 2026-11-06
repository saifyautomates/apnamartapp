import type { Metadata, Viewport } from "next";
import Header from "@/components/header/header-server";
import LaunchLoader from "@/components/loader";
import { PwaRegister } from "@/components/pwa";
import SiteChrome from "@/components/layout/site-chrome";
import { getAllSettings } from "@/lib/settings";
import "./globals.css";

// Live catalogue, prices and stock must never be baked in at build time:
// every route renders on request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Central Mart — 8 Minute FMCG Grocery Delivery",
  description: "India's 8-minute FMCG app. Order 100% genuine packaged groceries, dairy, staples, snacks, cold drinks, cleaning & personal care essentials online with Central Mart 8-minute instant delivery.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Central Mart",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Central Mart — 8 Minute FMCG Grocery Delivery",
    description: "India's 8-minute FMCG app. Order 100% genuine packaged groceries delivered in 8 minutes with Central Mart.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c831f",
  width: "device-width",
  initialScale: 1,
};

function monogramFor(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AG";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let storeName = "Central Mart";
  try {
    const settings = await getAllSettings();
    const store = settings.store as { name?: string } | undefined;
    if (store?.name) storeName = store.name;
  } catch {
    /* settings table may not exist yet on first boot — fall back to the default name */
  }
  return (
    <html lang="en">
      <body>
        <LaunchLoader storeName={storeName} monogram={monogramFor(storeName)} />
        <PwaRegister />
        <SiteChrome header={<Header storeName={storeName} />}>{children}</SiteChrome>
      </body>
    </html>
  );
}
