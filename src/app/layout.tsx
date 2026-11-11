import type { Metadata, Viewport } from "next";
import Header from "@/components/header/header-server";
import LaunchLoader from "@/components/loader";
import { PwaRegister } from "@/components/pwa";
import SiteChrome from "@/components/layout/site-chrome";
import { getAllSettings, type DeliveryConfig } from "@/lib/settings";
import { DeliveryProvider } from "@/lib/delivery-context";
import { BrandingProvider, type StoreBranding, DEFAULT_BRANDING } from "@/lib/branding-context";
import { LocalSeoSchema } from "@/components/seo/local-seo-schema";
import "./globals.css";

// Live catalogue, prices and stock must never be baked in at build time:
// every route renders on request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Central Mart — Kota's Online FMCG Supermarket | 80 Feet Road",
    template: "%s | Central Mart Kota",
  },
  description:
    "Order 100% genuine packaged groceries, dairy, staples, snacks, cold drinks, cleaning & personal care essentials online in Kota, Rajasthan. Located at 80 Feet Road with reliable Same-Day Doorstep Delivery.",
  keywords: [
    "grocery delivery kota",
    "online supermarket kota",
    "80 feet road kota grocery",
    "central mart kota",
    "grocery store 80 feet road kota",
    "fmcg supermarket kota rajasthan",
    "daily essentials delivery kota",
    "atta dal rice delivery kota",
    "same day grocery delivery kota",
    "dairy bread milk delivery kota",
    "snacks cold drinks delivery kota",
    "nayapura grocery delivery",
    "talwandi grocery delivery kota",
    "kunhari landmark city grocery delivery",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "hi-IN": "/",
    },
  },
  appleWebApp: {
    capable: true,
    title: "Central Mart Kota",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=20261108_emblem_v3", type: "image/svg+xml" },
      { url: "/favicon-32x32.png?v=20261108_emblem_v3", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=20261108_emblem_v3", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico?v=20261108_emblem_v3", sizes: "any" },
      { url: "/icons/icon-192.png?v=20261108_emblem_v3", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=20261108_emblem_v3", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=20261108_emblem_v3",
    apple: [
      { url: "/icons/apple-touch-icon.png?v=20261108_emblem_v3", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Central Mart — Kota's Online FMCG Supermarket | 80 Feet Road",
    description:
      "Order 100% genuine packaged groceries delivered right to your doorstep in Kota from Central Mart, 80 Feet Road. Best prices & Same-Day Delivery.",
    url: "/",
    siteName: "Central Mart Kota",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Central Mart — 80 Feet Road, Kota, Rajasthan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Central Mart — Kota's Online Supermarket (80 Feet Road)",
    description:
      "Kota's trusted FMCG grocery store at 80 Feet Road. 100% genuine staples, dairy, snacks & household essentials delivered same-day.",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
  let branding: StoreBranding = { ...DEFAULT_BRANDING };

  try {
    const settings = await getAllSettings();
    const store = settings.store as Partial<StoreBranding> | undefined;
    if (store) {
      if (store.name) {
        storeName = store.name;
        branding.name = store.name;
      }
      if (store.tagline) branding.tagline = store.tagline;
      if (store.logoUrl) branding.logoUrl = store.logoUrl;
      if (store.appIconUrl) branding.appIconUrl = store.appIconUrl;
      if (store.displayMode) branding.displayMode = store.displayMode;
    }
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
        {branding.appIconUrl ? (
          <>
            <link rel="icon" href={`${branding.appIconUrl}?v=20261108`} />
            <link rel="apple-touch-icon" href={`${branding.appIconUrl}?v=20261108`} />
          </>
        ) : (
          <>
            <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20261108_emblem_v3" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=20261108_emblem_v3" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=20261108_emblem_v3" />
            <link rel="shortcut icon" href="/favicon.ico?v=20261108_emblem_v3" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=20261108_emblem_v3" />
          </>
        )}
        <LocalSeoSchema
          storeName={storeName}
          tagline={branding.tagline}
          logoUrl={branding.logoUrl}
        />
      </head>
      <body>
        <BrandingProvider initial={branding}>
          <DeliveryProvider initialConfig={deliveryConfig}>
            <LaunchLoader
              storeName={storeName}
              monogram={monogramFor(storeName)}
              logoUrl={branding.logoUrl}
              appIconUrl={branding.appIconUrl}
            />
            <PwaRegister />
            <SiteChrome header={<Header storeName={storeName} logoUrl={branding.logoUrl} />}>
              {children}
            </SiteChrome>
          </DeliveryProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
