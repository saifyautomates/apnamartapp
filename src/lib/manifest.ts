export interface StoreManifestInfo {
  name?: string;
  tagline?: string;
  appIconUrl?: string;
}

export function buildManifest(store: StoreManifestInfo) {
  const storeName = store?.name || "Central Mart";
  const tagline = store?.tagline || "India's Same-Day FMCG Grocery Store";
  const appIconUrl = store?.appIconUrl || "";

  return {
    name: `${storeName} — Kota Online Grocery Store`,
    short_name: storeName,
    description: `${tagline} Kota's premier online supermarket delivering 100% genuine FMCG groceries, staples, dairy and daily essentials same-day.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0c831f",
    theme_color: "#0c831f",
    categories: ["shopping", "food", "lifestyle"],
    id: "/",
    icons: [
      ...(appIconUrl
        ? [
            {
              src: appIconUrl,
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: appIconUrl,
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ]
        : []),
      {
        src: "/icons/icon-192.png?v=20261108_v3",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png?v=20261108_v3",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png?v=20261108_v3",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png?v=20261108_v3",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Today's Best Deals",
        short_name: "Deals",
        description: "View Kota flash deals and daily essentials",
        url: "/#deals",
        icons: [{ src: appIconUrl || "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Cart & Checkout",
        short_name: "Cart",
        description: "View shopping cart and checkout",
        url: "/cart",
        icons: [{ src: appIconUrl || "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}

