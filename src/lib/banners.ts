import { prisma } from "./prisma";
import { cache, cachedJson } from "./cache";

export interface StoreBanner {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  buttonText: string;
  href: string;
  imageUrl: string;
  bgGradient: string; // e.g. "from-[#0c831f] via-[#107d22] to-[#146b2b]"
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export const DEFAULT_STORE_BANNERS: StoreBanner[] = [
  {
    id: "banner-fmcg-essentials-01",
    title: "Mega FMCG Grocery Sale",
    subtitle: "Up to 35% OFF on Dairy, Atta, Oil & Snacks",
    badgeText: "⚡ Same Day Doorstep Delivery",
    buttonText: "Shop Deals",
    href: "/category/dairy-eggs",
    imageUrl: "/images/banners/central-mart-fmcg-hero.jpg",
    bgGradient: "from-[#0c831f] via-[#107d22] to-[#146b2b]",
    isActive: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "banner-pantry-staples-02",
    title: "Weekend Pantry Dhamaka",
    subtitle: "Flat 25% OFF on Atta, Basmati Rice, Dal & Cooking Oil",
    badgeText: "🔥 PANTRY ESSENTIALS",
    buttonText: "Explore Staples",
    href: "/category/staples",
    imageUrl: "/images/banners/central-mart-fmcg-hero.jpg",
    bgGradient: "from-[#d97706] via-[#ea580c] to-[#c2410c]",
    isActive: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "banner-snacks-drinks-03",
    title: "Snack Attack & Cold Drinks",
    subtitle: "Biscuits, Chips, Chocolates & Chilled Beverages",
    badgeText: "🍿 PARTY PACKS",
    buttonText: "Grab Munchies",
    href: "/category/snacks",
    imageUrl: "/images/banners/central-mart-fmcg-hero.jpg",
    bgGradient: "from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]",
    isActive: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
  },
];

let memoryStoreBanners: StoreBanner[] = [...DEFAULT_STORE_BANNERS];

async function withFastDbTimeout<T>(promise: Promise<T>, timeoutMs = 200): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), timeoutMs)
    ),
  ]);
}

/** Fetch active store banners for customer storefront (cached) */
export async function getStoreBanners(): Promise<StoreBanner[]> {
  try {
    return await cachedJson("home_store_banners_v2", 30, async () => {
      try {
        const row = await withFastDbTimeout(prisma.setting.findUnique({ where: { key: "store_banners" } }));
        if (row?.value && Array.isArray(row.value) && row.value.length > 0) {
          memoryStoreBanners = row.value as unknown as StoreBanner[];
        }
      } catch {
        // fallback
      }
      return memoryStoreBanners
        .filter((b) => b.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder);
    });
  } catch {
    return memoryStoreBanners;
  }
}

/** Fetch all banners for Admin panel management */
export async function getAllStoreBanners(): Promise<StoreBanner[]> {
  try {
    const row = await withFastDbTimeout(prisma.setting.findUnique({ where: { key: "store_banners" } }));
    if (row?.value && Array.isArray(row.value) && row.value.length > 0) {
      memoryStoreBanners = row.value as unknown as StoreBanner[];
      return (row.value as unknown as StoreBanner[]).sort((a, b) => a.displayOrder - b.displayOrder);
    }
  } catch {
    // fallback
  }
  return memoryStoreBanners;
}

/** Save updated banners and invalidate caches */
export async function saveStoreBanners(banners: StoreBanner[]): Promise<StoreBanner[]> {
  memoryStoreBanners = banners;
  try {
    await withFastDbTimeout(prisma.setting.upsert({
      where: { key: "store_banners" },
      create: { key: "store_banners", value: banners as unknown as object },
      update: { value: banners as unknown as object },
    }));
  } catch {
    /* fallback */
  }

  // Invalidate cache immediately
  await cache.del("home_store_banners_v2");
  await cache.del("home_rails_fmcg_v1");

  return banners;
}
