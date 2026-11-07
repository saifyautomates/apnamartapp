"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { openSearchModal } from "@/components/search/search-modal";

/**
 * 20 Signature Quick-Commerce FMCG Categories (2 rows of 10).
 * 100% packaged consumer goods only — strictly no raw vegetables or fruits.
 */
export const FMCG_CATEGORIES_ROW_1 = [
  { slug: "paan-corner", name: "Paan\nCorner", img: "/images/categories/paan-corner.jpg", href: "/category/paan-corner", query: "paan" },
  { slug: "dairy-eggs", name: "Dairy, Bread\n& Eggs", img: "/images/categories/dairy-bread.jpg", href: "/category/dairy-eggs", query: "dairy milk bread" },
  { slug: "staples", name: "Atta, Rice\n& Dal", img: "/images/categories/atta-rice-dal.jpg", href: "/category/staples", query: "atta rice dal" },
  { slug: "masala-oil", name: "Edible Oils\n& Ghee", img: "/images/categories/masala-oil.jpg", href: "/category/masala-oil", query: "oil ghee" },
  { slug: "cold-drinks", name: "Cold Drinks\n& Juices", img: "/images/categories/cold-drinks.jpg", href: "/category/cold-drinks", query: "cold drink juice pepsi" },
  { slug: "snacks", name: "Snacks &\nMunchies", img: "/images/categories/snacks-munchies.jpg", href: "/category/snacks", query: "snacks chips biscuit" },
  { slug: "breakfast", name: "Breakfast &\nInstant Food", img: "/images/categories/breakfast-instant.jpg", href: "/category/breakfast", query: "maggi breakfast oats" },
  { slug: "sweet-tooth", name: "Sweet\nTooth", img: "/images/categories/sweet-tooth.jpg", href: "/category/sweet-tooth", query: "chocolate sweet sugar" },
  { slug: "bakery-biscuits", name: "Bakery &\nBiscuits", img: "/images/categories/bakery-biscuits.jpg", href: "/category/bakery-biscuits", query: "biscuit cookie rusk" },
  { slug: "tea-coffee", name: "Tea, Coffee &\nMilk Drinks", img: "/images/categories/tea-coffee.jpg", href: "/category/tea-coffee", query: "tea coffee boost" },
];

export const FMCG_CATEGORIES_ROW_2 = [
  { slug: "sauces-spreads", name: "Sauces &\nSpreads", img: "/images/categories/sauces-spreads.jpg", href: "/category/sauces-spreads", query: "sauce ketchup jam" },
  { slug: "cleaning-essentials", name: "Cleaning\nEssentials", img: "/images/categories/cleaning-essentials.jpg", href: "/category/cleaning-essentials", query: "surf detergent clean" },
  { slug: "household", name: "Home &\nHousehold", img: "/images/categories/household.jpg", href: "/category/household", query: "home foil tissue" },
  { slug: "personal-care", name: "Personal\nCare", img: "/images/categories/personal-care.jpg", href: "/category/personal-care", query: "soap shampoo toothpaste" },
  { slug: "baby-care", name: "Baby\nCare", img: "/images/categories/baby-care-cat.jpg", href: "/category/baby-care", query: "diaper baby wipes" },
  { slug: "pharma-wellness", name: "Pharma &\nWellness", img: "/images/categories/pharma-wellness.jpg", href: "/category/pharma-wellness", query: "dettol bandaid wellness" },
  { slug: "organic-healthy", name: "Organic &\nHealthy Living", img: "/images/categories/organic-healthy.jpg", href: "/category/organic-healthy", query: "honey green tea muesli" },
  { slug: "beverages", name: "Energy Drinks\n& Beverages", img: "/images/categories/beverages.jpg", href: "/category/beverages", query: "red bull sting glucose" },
  { slug: "home-office", name: "Home &\nOffice", img: "/images/categories/home-office.jpg", href: "/category/home-office", query: "tape battery bulb notebook" },
  { slug: "pet-care", name: "Pet\nCare", img: "/images/categories/pet-care-cat.jpg", href: "/category/pet-care", query: "pedigree whiskas dog food" },
];

export function CategoryGrid() {
  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, query: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openSearchModal(query);
  };

  return (
    <section className="space-y-4 pt-2">
      {/* Row 1 (FMCG Food & Staples) */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
        {FMCG_CATEGORIES_ROW_1.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            onClick={(e) => handleCategoryClick(e, cat.query)}
            className="group flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="h-16 w-16 sm:h-22 sm:w-22 rounded-2xl bg-[#f4f6fb] group-hover:bg-[#e9f0fa] transition-all duration-200 flex items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105">
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

      {/* Row 2 (FMCG Personal, Home & Baby Care) */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
        {FMCG_CATEGORIES_ROW_2.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            onClick={(e) => handleCategoryClick(e, cat.query)}
            className="group flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="h-16 w-16 sm:h-22 sm:w-22 rounded-2xl bg-[#f4f6fb] group-hover:bg-[#e9f0fa] transition-all duration-200 flex items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105">
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
