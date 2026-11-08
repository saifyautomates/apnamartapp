import type { Metadata, Viewport } from "next";
import Header from "@/components/header/header-server";
import LaunchLoader from "@/components/loader";
import { PwaRegister } from "@/components/pwa";
import SiteChrome from "@/components/layout/site-chrome";
import { getAllSettings, type DeliveryConfig } from "@/lib/settings";
import { DeliveryProvider } from "@/lib/delivery-context";
import "./globals.css";

// Live catalogue, prices and stock must never be baked in at build time:
// every route renders on request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Central Mart — Kota's Online FMCG Supermarket",
  description: "Order 100% genuine packaged groceries, dairy, staples, snacks, cold drinks, cleaning & personal care essentials online in Kota, Rajasthan with Central Mart reliable Same-Day Doorstep Delivery.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Central Mart",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Central Mart — Kota's Online FMCG Supermarket",
    description: "Order 100% genuine packaged groceries delivered right to your doorstep in Kota with Central Mart Same-Day Delivery.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c831f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function monogramFor(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let storeName = "Central Mart";
  let deliveryConfig: Partial<DeliveryConfig> = {};
  try {
    const settings = await getAllSettings();
    const store = settings.store as { name?: string } | undefined;
    if (store?.name) storeName = store.name;
    if (settings.delivery) deliveryConfig = settings.delivery as Partial<DeliveryConfig>;
  } catch {
    /* settings table may not exist yet on first boot — fall back to the default name */
  }
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://ezwkjxhdkhgvyahypsjn.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ezwkjxhdkhgvyahypsjn.supabase.co" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body>
        <DeliveryProvider initialConfig={deliveryConfig}>
          <LaunchLoader storeName={storeName} monogram={monogramFor(storeName)} />
          <PwaRegister />
          <SiteChrome header={<Header storeName={storeName} />}>{children}</SiteChrome>
        </DeliveryProvider>
      </body>
    </html>
  );
}
