import { prisma } from "./prisma";
import { cachedJson } from "./cache";
import { getStoreBanners, StoreBanner } from "./banners";
import { FMCG_CATEGORIES } from "./fmcg-catalog";
import { VariantCardProps } from "@/components/product";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Flatten all FMCG categories and variants into typed VariantCardProps items */
export function getFallbackVariants(categorySlugs?: string[], limit = 20): VariantCardProps[] {
  const matchingCategories = categorySlugs
    ? FMCG_CATEGORIES.filter((c) => categorySlugs.includes(c.slug))
    : FMCG_CATEGORIES;

  const results: VariantCardProps[] = [];

  for (const cat of matchingCategories) {
    for (const item of cat.items) {
      for (const v of item.variants) {
        const prodSlug = slugify(item.name);
        const varId = `fmcg-var-${prodSlug}-${slugify(v.pack)}`;
        results.push({
          id: varId,
          name: `${item.name} (${v.pack})`,
          packSize: v.pack,
          mrpPaise: Math.round(v.mrp * 100),
          sellingPaise: Math.round(v.selling * 100),
          product: {
            id: `fmcg-prod-${prodSlug}`,
            name: item.name,
            slug: prodSlug,
            brand: item.brand ? { name: item.brand } : null,
            images: [{ url: `/images/products/${prodSlug}.jpg` }],
          },
          inventory: {
            availableQty: v.stock ?? 100,
            reservedQty: 0,
          },
        });
        if (results.length >= limit) return results;
      }
    }
  }

  return results;
}

/** Fallback categories list matching CategoryGrid and CategoriesPage */
export function getFallbackCategories() {
  return FMCG_CATEGORIES.map((c, index) => ({
    id: `cat-${c.slug}`,
    name: c.name,
    slug: c.slug,
    description: `${c.subcategories.slice(0, 3).join(", ")} & more`,
    sortOrder: index + 1,
    isVisible: true,
    subcategories: c.subcategories.map((sub, sIdx) => ({
      id: `sub-${c.slug}-${slugify(sub)}`,
      name: sub,
      slug: slugify(sub),
      sortOrder: sIdx + 1,
      isVisible: true,
    })),
  }));
}

/** Fallback single product view by slug */
export function getFallbackProduct(slug: string) {
  for (const cat of FMCG_CATEGORIES) {
    for (const item of cat.items) {
      const prodSlug = slugify(item.name);
      if (prodSlug === slug) {
        return {
          id: `fmcg-prod-${prodSlug}`,
          name: item.name,
          slug: prodSlug,
          description: `${item.name} by ${item.brand}. 100% genuine packaged FMCG delivered to your doorstep.`,
          brand: { name: item.brand },
          category: { id: `cat-${cat.slug}`, name: cat.name, slug: cat.slug },
          subcategory: item.sub ? { id: `sub-${slugify(item.sub)}`, name: item.sub, slug: slugify(item.sub) } : null,
          images: [{ url: `/images/products/${prodSlug}.jpg` }],
          variants: item.variants.map((v) => ({
            id: `fmcg-var-${prodSlug}-${slugify(v.pack)}`,
            name: `${item.name} (${v.pack})`,
            packSize: v.pack,
            mrpPaise: Math.round(v.mrp * 100),
            sellingPaise: Math.round(v.selling * 100),
            onlinePricePaise: null,
            priceSource: "MANUAL",
            inventory: { availableQty: v.stock ?? 100, reservedQty: 0 },
          })),
        };
      }
    }
  }
  return null;
}

export interface HomeRailsData {
  dairyItems: VariantCardProps[];
  snackItems: VariantCardProps[];
  drinkItems: VariantCardProps[];
  stapleItems: VariantCardProps[];
  personalCareItems: VariantCardProps[];
  deals: VariantCardProps[];
  storeBanners: StoreBanner[];
}

/**
 * Bulletproof data loader for homepage rails.
 * Tries live DB with caching first; if DB is unconfigured, cold, or times out,
 * seamlessly falls back to pre-built authentic FMCG catalogue so page NEVER throws.
 */
export async function getHomeRailsSafe(): Promise<HomeRailsData> {
  try {
    const data = await cachedJson(
      "home_rails_fmcg_v2",
      30,
      async () => {
        // Query live Prisma database in parallel
        const [
          dairyDb,
          snackDb,
          drinkDb,
          stapleDb,
          personalCareDb,
          dealsDb,
          banners,
        ] = await Promise.all([
          prisma.productVariant
            .findMany({
              where: {
                product: {
                  category: { slug: "dairy-eggs" },
                  isActive: true,
                  onlineVisible: true,
                  deletedAt: null,
                },
              },
              include: {
                product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
                inventory: true,
              },
              take: 12,
            })
            .catch(() => []),

          prisma.productVariant
            .findMany({
              where: {
                product: {
                  category: { slug: "snacks" },
                  isActive: true,
                  onlineVisible: true,
                  deletedAt: null,
                },
              },
              include: {
                product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
                inventory: true,
              },
              take: 12,
            })
            .catch(() => []),

          prisma.productVariant
            .findMany({
              where: {
                product: {
                  category: { slug: { in: ["cold-drinks", "beverages", "tea-coffee"] } },
                  isActive: true,
                  onlineVisible: true,
                  deletedAt: null,
                },
              },
              include: {
                product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
                inventory: true,
              },
              take: 12,
            })
            .catch(() => []),

          prisma.productVariant
            .findMany({
              where: {
                product: {
                  category: { slug: { in: ["staples", "masala-oil"] } },
                  isActive: true,
                  onlineVisible: true,
                  deletedAt: null,
                },
              },
              include: {
                product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
                inventory: true,
              },
              take: 12,
            })
            .catch(() => []),

          prisma.productVariant
            .findMany({
              where: {
                product: {
                  category: { slug: { in: ["personal-care", "cleaning-essentials", "household"] } },
                  isActive: true,
                  onlineVisible: true,
                  deletedAt: null,
                },
              },
              include: {
                product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
                inventory: true,
              },
              take: 12,
            })
            .catch(() => []),

          prisma.productVariant
            .findMany({
              where: {
                product: { isActive: true, onlineVisible: true, deletedAt: null },
              },
              include: {
                product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
                inventory: true,
              },
              take: 30,
            })
            .catch(() => []),

          getStoreBanners().catch(() => []),
        ]);

        return {
          dairyItems: (dairyDb.length > 0 ? dairyDb : getFallbackVariants(["dairy-eggs"], 12)) as unknown as VariantCardProps[],
          snackItems: (snackDb.length > 0 ? snackDb : getFallbackVariants(["snacks"], 12)) as unknown as VariantCardProps[],
          drinkItems: (drinkDb.length > 0 ? drinkDb : getFallbackVariants(["cold-drinks", "tea-coffee"], 12)) as unknown as VariantCardProps[],
          stapleItems: (stapleDb.length > 0 ? stapleDb : getFallbackVariants(["staples", "masala-oil"], 12)) as unknown as VariantCardProps[],
          personalCareItems: (personalCareDb.length > 0 ? personalCareDb : getFallbackVariants(["personal-care", "cleaning-essentials"], 12)) as unknown as VariantCardProps[],
          deals: (dealsDb.length > 0 ? dealsDb : getFallbackVariants(["dairy-eggs", "snacks", "staples"], 24)) as unknown as VariantCardProps[],
          storeBanners: banners && banners.length > 0 ? banners : [],
        };
      }
    );

    // If storeBanners is somehow empty, get defaults
    if (!data.storeBanners || data.storeBanners.length === 0) {
      data.storeBanners = await getStoreBanners().catch(() => []);
    }

    return data;
  } catch (err) {
    console.warn("[resilient-catalog] Homepage DB query skipped, serving fallback FMCG data:", err);
    // Absolute fallback: NEVER crash the page
    const banners = await getStoreBanners().catch(() => []);
    return {
      dairyItems: getFallbackVariants(["dairy-eggs"], 12),
      snackItems: getFallbackVariants(["snacks"], 12),
      drinkItems: getFallbackVariants(["cold-drinks", "tea-coffee"], 12),
      stapleItems: getFallbackVariants(["staples", "masala-oil"], 12),
      personalCareItems: getFallbackVariants(["personal-care", "cleaning-essentials"], 12),
      deals: getFallbackVariants(["dairy-eggs", "snacks", "staples"], 24),
      storeBanners: banners,
    };
  }
}
