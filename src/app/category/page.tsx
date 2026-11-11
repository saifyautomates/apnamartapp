import { prisma, withDbTimeout } from "@/lib/prisma";
import { getFallbackCategories } from "@/lib/resilient-catalog";
import { CategoriesScreenView, CategoryCardData } from "@/components/category/categories-screen-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Categories | Central Mart Kota (80 Feet Road)",
  description: "Browse 100% genuine grocery categories: Snacks & Namkeen, Beverages, Personal Care, Dairy & Breakfast, Household Essentials and more with 12-15 min doorstep delivery in Kota.",
};

const CATEGORY_MAP: Record<string, string> = {
  "baby-care": "/images/products/himalaya-baby-massage-oil.jpg",
  "personal-care": "/images/products/dove-cream-beauty-bathing-bar.jpg",
  "pet-care": "/images/products/pedigree-adult-dry-dog-food.jpg",
  "dairy-eggs": "/images/products/amul-butter-pasteurised.jpg",
  "dairy": "/images/products/amul-butter-pasteurised.jpg",
  "staples": "/images/products/aashirvaad-shudh-chakki-atta.jpg",
  "cooking-essentials": "/images/products/fortune-sunlite-sunflower-oil.jpg",
  "masala-oil": "/images/products/fortune-sunlite-sunflower-oil.jpg",
  "packaged-instant-foods": "/images/products/maggi-2-minute-instant-noodles.jpg",
  "breakfast": "/images/products/maggi-2-minute-instant-noodles.jpg",
  "snacks": "/images/products/lays-classic-salted-potato-chips.jpg",
  "snacks-munchies": "/images/products/lays-classic-salted-potato-chips.jpg",
  "sweet-tooth": "/images/products/cadbury-dairy-milk-chocolate.jpg",
  "tea-coffee": "/images/products/taj-mahal-tea.jpg",
  "beverages": "/images/products/coca-cola-original-soft-drink.jpg",
  "cold-drinks": "/images/products/coca-cola-original-soft-drink.jpg",
  "cleaning-essentials": "/images/products/surf-excel-easy-wash-detergent-powder.jpg",
  "household": "/images/products/surf-excel-easy-wash-detergent-powder.jpg",
  "pharma-wellness": "/images/products/dettol-original-germ-protection-liquid-handwash.jpg",
  "fruits-vegetables": "/images/products/lays-classic-salted-potato-chips.jpg",
  "sauces-spreads": "/images/products/maggi-2-minute-instant-noodles.jpg",
  "organic-healthy": "/images/products/tata-salt-iodized.jpg",
};

export default async function CategoriesPage() {
  let categories: Array<{
    id: string;
    name: string;
    slug: string;
  }> = [];

  try {
    categories = await withDbTimeout(
      prisma.category.findMany({
        where: { isVisible: true },
        select: { id: true, name: true, slug: true },
        orderBy: { sortOrder: "asc" },
      }),
      2500
    );
  } catch {
    /* fallback to resilient catalog */
  }

  if (!categories || categories.length === 0) {
    categories = getFallbackCategories();
  }

  const categoryCards: CategoryCardData[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: CATEGORY_MAP[c.slug] || "/images/products/lays-classic-salted-potato-chips.jpg",
  }));

  return <CategoriesScreenView initialCategories={categoryCards} />;
}
