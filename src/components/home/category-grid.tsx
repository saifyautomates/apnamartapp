"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { openSearchModal } from "@/components/search/search-modal";
import { openCategoriesModal } from "@/components/category/category-drawer";

/**
 * 20 Signature FMCG Grocery Categories.
 */
export const FMCG_CATEGORIES_ROW_1 = [
  { slug: "staples", name: "Grocery &\nStaples", img: "/images/categories/atta-rice-dal.jpg", href: "/category/staples", query: "grocery staples atta dal rice" },
  { slug: "snacks-beverages", name: "Snacks &\nBeverages", img: "/images/categories/snacks-munchies.jpg", href: "/category/snacks", query: "snacks chips cold drink juice" },
  { slug: "personal-care", name: "Personal\nCare", img: "/images/categories/personal-care-cat.jpg", href: "/category/personal-care", query: "soap shampoo toothpaste cream" },
  { slug: "cleaning-essentials", name: "Home\nCare", img: "/images/categories/cleaning-essentials.jpg", href: "/category/cleaning-essentials", query: "surf detergent cleaning harpic" },
  { slug: "dairy-eggs", name: "Dairy &\nBakery", img: "/images/categories/dairy-bread.jpg", href: "/category/dairy-eggs", query: "milk butter curd paneer bread" },
  { slug: "masala-oil", name: "Cooking\nEssentials", img: "/images/categories/masala-oil.jpg", href: "/category/masala-oil", query: "oil ghee spices masala salt" },
  { slug: "baby-care", name: "Baby\nCare", img: "/images/categories/baby-care-cat.jpg", href: "/category/baby-care", query: "diaper baby wipes" },
  { slug: "fruits-veg", name: "Fruits &\nVegetables", img: "/images/categories/fruits-vegetables.jpg", href: "/category/fruits-vegetables", query: "fruits vegetables fresh" },
  { slug: "cold-drinks", name: "Cold Drinks\n& Juices", img: "/images/categories/cold-drinks.jpg", href: "/category/cold-drinks", query: "cold drink juice pepsi" },
  { slug: "bakery-biscuits", name: "Bakery &\nBiscuits", img: "/images/categories/bakery-biscuits.jpg", href: "/category/bakery-biscuits", query: "biscuit cookie rusk" },
];

export const FMCG_CATEGORIES_ROW_2 = [
  { slug: "breakfast", name: "Breakfast &\nInstant Food", img: "/images/categories/breakfast-instant.jpg", href: "/category/breakfast", query: "maggi breakfast oats" },
  { slug: "sweet-tooth", name: "Sweet\nTooth", img: "/images/categories/sweet-tooth.jpg", href: "/category/sweet-tooth", query: "chocolate sweet sugar" },
  { slug: "tea-coffee", name: "Tea, Coffee &\nDrinks", img: "/images/categories/tea-coffee.jpg", href: "/category/tea-coffee", query: "tea coffee boost" },
  { slug: "sauces-spreads", name: "Sauces &\nSpreads", img: "/images/categories/sauces-spreads.jpg", href: "/category/sauces-spreads", query: "sauce ketchup jam" },
  { slug: "household", name: "Home &\nKitchen", img: "/images/categories/household.jpg", href: "/category/household", query: "home foil tissue" },
  { slug: "pharma-wellness", name: "Pharma &\nWellness", img: "/images/categories/pharma-wellness.jpg", href: "/category/pharma-wellness", query: "dettol bandaid wellness" },
  { slug: "organic-healthy", name: "Organic &\nHealthy", img: "/images/categories/organic-healthy.jpg", href: "/category/organic-healthy", query: "honey green tea muesli" },
  { slug: "beverages", name: "Energy Drinks\n& Soda", img: "/images/categories/beverages.jpg", href: "/category/beverages", query: "red bull sting glucose" },
  { slug: "home-office", name: "Home &\nOffice", img: "/images/categories/home-office.jpg", href: "/category/home-office", query: "tape battery bulb notebook" },
  { slug: "pet-care", name: "Pet\nCare", img: "/images/categories/pet-care-cat.jpg", href: "/category/pet-care", query: "pedigree whiskas dog food" },
];

export const MOCKUP_PHONE1_CATEGORIES = FMCG_CATEGORIES_ROW_1.slice(0, 7);

export function CategoryGrid() {
  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, query: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openSearchModal(query);
  };

  return (
    <section className="space-y-3 pt-2">
      {/* Header Row (Matching Phone 1 Mockup) */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
          Shop by Category
        </h3>
        <button
          onClick={openCategoriesModal}
          className="text-xs sm:text-sm font-bold text-[#0c831f] hover:text-[#0a701a] flex items-center gap-0.5 active:scale-95 transition cursor-pointer"
        >
          <span>View All</span>
          <span className="text-xs">›</span>
        </button>
      </div>

      {/* 8 Category Tiles Grid (2 Rows x 4 Columns on Mobile - Matches Phone 1 Mockup) */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
        {MOCKUP_PHONE1_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            onClick={(e) => handleCategoryClick(e, cat.query)}
            className="group flex flex-col items-center text-center cursor-pointer active:scale-90 transition-transform"
          >
            <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-[#f8faf8] group-hover:bg-[#e9f0fa] transition-all duration-200 flex items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105 border border-neutral-100">
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

        {/* 8th Tile: More Categories (Matches Phone 1 Mockup) */}
        <button
          onClick={openCategoriesModal}
          className="group flex flex-col items-center text-center cursor-pointer active:scale-90 transition-transform"
        >
          <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-[#e8f5e9]/70 group-hover:bg-[#e8f5e9] transition-all duration-200 flex flex-col items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105 border border-[#0c831f]/20 text-[#0c831f]">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-[#0c831f] leading-tight whitespace-pre-line transition min-h-[1.8rem]">
            More{"\n"}Categories
          </span>
        </button>
      </div>
    </section>
  );
}

export default CategoryGrid;
