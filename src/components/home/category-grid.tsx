"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { openSearchModal } from "@/components/search/search-modal";
import { openCategoriesModal } from "@/components/category/category-drawer";

/**
 * 20 Signature FMCG Grocery Categories.
 */
export const FMCG_CATEGORIES_ROW_1 = [
  { slug: "fruits", name: "Fruits", img: "/images/categories/fruits-vegetables.jpg", href: "/category/fruits-vegetables", query: "apple banana fruits fresh" },
  { slug: "vegetables", name: "Vegetables", img: "/images/categories/fruits-vegetables.jpg", href: "/category/fruits-vegetables", query: "tomato onion potato vegetables" },
  { slug: "dairy", name: "Dairy", img: "/images/categories/dairy-bread.jpg", href: "/category/dairy-eggs", query: "milk dairy butter curd" },
  { slug: "snacks", name: "Snacks", img: "/images/categories/snacks-munchies.jpg", href: "/category/snacks", query: "snacks chips biscuit namkeen" },
  { slug: "household", name: "Household", img: "/images/categories/cleaning-essentials.jpg", href: "/category/cleaning-essentials", query: "surf detergent clean household" },
  { slug: "staples", name: "Atta, Rice\n& Dal", img: "/images/categories/atta-rice-dal.jpg", href: "/category/staples", query: "atta rice dal" },
  { slug: "cold-drinks", name: "Drinks &\nJuices", img: "/images/categories/cold-drinks.jpg", href: "/category/cold-drinks", query: "cold drink juice pepsi" },
  { slug: "masala-oil", name: "Edible Oils\n& Ghee", img: "/images/categories/masala-oil.jpg", href: "/category/masala-oil", query: "oil ghee" },
  { slug: "breakfast", name: "Breakfast &\nInstant", img: "/images/categories/breakfast-instant.jpg", href: "/category/breakfast", query: "maggi breakfast oats" },
  { slug: "bakery-biscuits", name: "Bakery &\nBiscuits", img: "/images/categories/bakery-biscuits.jpg", href: "/category/bakery-biscuits", query: "biscuit cookie rusk" },
];

export const FMCG_CATEGORIES_ROW_2 = [
  { slug: "sauces-spreads", name: "Sauces &\nSpreads", img: "/images/categories/sauces-spreads.jpg", href: "/category/sauces-spreads", query: "sauce ketchup jam" },
  { slug: "household", name: "Home &\nKitchen", img: "/images/categories/household.jpg", href: "/category/household", query: "home foil tissue" },
  { slug: "personal-care", name: "Personal\nCare", img: "/images/categories/personal-care.jpg", href: "/category/personal-care", query: "soap shampoo toothpaste" },
  { slug: "baby-care", name: "Baby\nCare", img: "/images/categories/baby-care-cat.jpg", href: "/category/baby-care", query: "diaper baby wipes" },
  { slug: "pharma-wellness", name: "Pharma &\nWellness", img: "/images/categories/pharma-wellness.jpg", href: "/category/pharma-wellness", query: "dettol bandaid wellness" },
  { slug: "organic-healthy", name: "Organic &\nHealthy", img: "/images/categories/organic-healthy.jpg", href: "/category/organic-healthy", query: "honey green tea muesli" },
  { slug: "beverages", name: "Energy Drinks\n& Soda", img: "/images/categories/beverages.jpg", href: "/category/beverages", query: "red bull sting glucose" },
  { slug: "home-office", name: "Home &\nOffice", img: "/images/categories/home-office.jpg", href: "/category/home-office", query: "tape battery bulb notebook" },
  { slug: "paan-corner", name: "Paan\nCorner", img: "/images/categories/paan-corner.jpg", href: "/category/paan-corner", query: "paan" },
  { slug: "pet-care", name: "Pet\nCare", img: "/images/categories/pet-care-cat.jpg", href: "/category/pet-care", query: "pedigree whiskas dog food" },
];

export function CategoryGrid() {
  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, query: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openSearchModal(query);
  };

  return (
    <section className="space-y-3 pt-2">
      {/* Header Row (Matching Screen 1 Mockup) */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
          Shop by Category
        </h3>
        <button
          onClick={openCategoriesModal}
          className="text-xs sm:text-sm font-bold text-[#0c831f] hover:text-[#0a701a] flex items-center gap-0.5 active:scale-95 transition cursor-pointer"
        >
          <span>View All</span>
          <span className="text-xs">→</span>
        </button>
      </div>

      {/* Row 1 (Top Categories) */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
        {FMCG_CATEGORIES_ROW_1.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            onClick={(e) => handleCategoryClick(e, cat.query)}
            className="group flex flex-col items-center text-center cursor-pointer active:scale-90 transition-transform"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#f4f6fb] group-hover:bg-[#e9f0fa] transition-all duration-200 flex items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105 border border-neutral-100">
              <ProductImage
                src={cat.img}
                alt={cat.name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-[#1c1c1c] leading-tight whitespace-pre-line group-hover:text-[#0c831f] transition min-h-[1.8rem]">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Row 2 (Second Tier Categories) */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
        {FMCG_CATEGORIES_ROW_2.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            onClick={(e) => handleCategoryClick(e, cat.query)}
            className="group flex flex-col items-center text-center cursor-pointer active:scale-90 transition-transform"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#f4f6fb] group-hover:bg-[#e9f0fa] transition-all duration-200 flex items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105 border border-neutral-100">
              <ProductImage
                src={cat.img}
                alt={cat.name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-[#1c1c1c] leading-tight whitespace-pre-line group-hover:text-[#0c831f] transition min-h-[1.8rem]">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;
