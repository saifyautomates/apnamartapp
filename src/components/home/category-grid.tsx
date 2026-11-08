"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { openSearchModal } from "@/components/search/search-modal";
import { openCategoriesModal } from "@/components/category/category-drawer";

/**
 * 20 Signature FMCG Grocery Categories with curated colors.
 */
export const FMCG_CATEGORIES_ROW_1 = [
  { slug: "staples", name: "Grocery &\nStaples", img: "/images/categories/atta-rice-dal.jpg", href: "/category/staples", query: "grocery staples atta dal rice", tint: "from-amber-50 to-orange-50 border-amber-100" },
  { slug: "snacks-beverages", name: "Snacks &\nBeverages", img: "/images/categories/snacks-munchies.jpg", href: "/category/snacks", query: "snacks chips cold drink juice", tint: "from-orange-50 to-rose-50 border-orange-100" },
  { slug: "personal-care", name: "Personal\nCare", img: "/images/categories/personal-care-cat.jpg", href: "/category/personal-care", query: "soap shampoo toothpaste cream", tint: "from-purple-50 to-indigo-50 border-purple-100" },
  { slug: "cleaning-essentials", name: "Home\nCare", img: "/images/categories/cleaning-essentials.jpg", href: "/category/cleaning-essentials", query: "surf detergent cleaning harpic", tint: "from-blue-50 to-cyan-50 border-blue-100" },
  { slug: "dairy-eggs", name: "Dairy &\nBakery", img: "/images/categories/dairy-bread.jpg", href: "/category/dairy-eggs", query: "milk butter curd paneer bread", tint: "from-emerald-50 to-teal-50 border-emerald-100" },
  { slug: "masala-oil", name: "Cooking\nEssentials", img: "/images/categories/masala-oil.jpg", href: "/category/masala-oil", query: "oil ghee spices masala salt", tint: "from-yellow-50 to-amber-50 border-yellow-100" },
  { slug: "baby-care", name: "Baby\nCare", img: "/images/categories/baby-care-cat.jpg", href: "/category/baby-care", query: "diaper baby wipes", tint: "from-pink-50 to-rose-50 border-pink-100" },
  { slug: "fruits-veg", name: "Fruits &\nVegetables", img: "/images/categories/fruits-vegetables.jpg", href: "/category/fruits-vegetables", query: "fruits vegetables fresh", tint: "from-green-50 to-emerald-50 border-green-100" },
];

export const FMCG_CATEGORIES_ROW_2 = [
  { slug: "breakfast", name: "Breakfast &\nInstant Food", img: "/images/categories/breakfast-instant.jpg", href: "/category/breakfast", query: "maggi breakfast oats", tint: "from-amber-50 to-yellow-50 border-amber-100" },
  { slug: "sweet-tooth", name: "Sweet\nTooth", img: "/images/categories/sweet-tooth.jpg", href: "/category/sweet-tooth", query: "chocolate sweet sugar", tint: "from-pink-50 to-rose-50 border-pink-100" },
  { slug: "tea-coffee", name: "Tea, Coffee &\nDrinks", img: "/images/categories/tea-coffee.jpg", href: "/category/tea-coffee", query: "tea coffee boost", tint: "from-orange-50 to-amber-50 border-orange-100" },
  { slug: "sauces-spreads", name: "Sauces &\nSpreads", img: "/images/categories/sauces-spreads.jpg", href: "/category/sauces-spreads", query: "sauce ketchup jam", tint: "from-red-50 to-rose-50 border-red-100" },
  { slug: "household", name: "Home &\nKitchen", img: "/images/categories/household.jpg", href: "/category/household", query: "home foil tissue", tint: "from-slate-50 to-neutral-50 border-slate-100" },
  { slug: "pharma-wellness", name: "Pharma &\nWellness", img: "/images/categories/pharma-wellness.jpg", href: "/category/pharma-wellness", query: "dettol bandaid wellness", tint: "from-teal-50 to-emerald-50 border-teal-100" },
  { slug: "organic-healthy", name: "Organic &\nHealthy", img: "/images/categories/organic-healthy.jpg", href: "/category/organic-healthy", query: "honey green tea muesli", tint: "from-lime-50 to-emerald-50 border-lime-100" },
  { slug: "beverages", name: "Energy Drinks\n& Soda", img: "/images/categories/beverages.jpg", href: "/category/beverages", query: "red bull sting glucose", tint: "from-cyan-50 to-blue-50 border-cyan-100" },
  { slug: "home-office", name: "Home &\nOffice", img: "/images/categories/home-office.jpg", href: "/category/home-office", query: "tape battery bulb notebook", tint: "from-gray-50 to-slate-50 border-gray-100" },
  { slug: "pet-care", name: "Pet\nCare", img: "/images/categories/pet-care-cat.jpg", href: "/category/pet-care", query: "pedigree whiskas dog food", tint: "from-amber-50 to-orange-50 border-amber-100" },
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
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
          Shop by Category
        </h3>
        <button
          onClick={openCategoriesModal}
          className="text-xs sm:text-sm font-bold text-[#0c831f] hover:text-[#0a701a] flex items-center gap-1 active:scale-95 transition cursor-pointer"
        >
          <span>View All</span>
          <span className="text-xs">›</span>
        </button>
      </div>

      {/* 8 Category Tiles Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
        {MOCKUP_PHONE1_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            onClick={(e) => handleCategoryClick(e, cat.query)}
            className="group flex flex-col items-center text-center cursor-pointer active:scale-90 transition-transform"
          >
            <div className={`h-18 w-18 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-b ${cat.tint} group-hover:scale-105 transition-all duration-300 flex items-center justify-center p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group-hover:shadow-md border`}>
              <ProductImage
                src={cat.img}
                alt={cat.name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="mt-1.5 text-[11px] sm:text-xs font-bold text-neutral-800 group-hover:text-[#0c831f] transition-colors leading-tight whitespace-pre-line line-clamp-2">
              {cat.name}
            </span>
          </Link>
        ))}

        {/* 8th Tile: More Categories Button */}
        <button
          onClick={openCategoriesModal}
          className="group flex flex-col items-center text-center cursor-pointer active:scale-90 transition-transform"
        >
          <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-3xl bg-emerald-50/70 group-hover:bg-emerald-100/80 transition-all duration-300 flex items-center justify-center p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group-hover:shadow-md border border-emerald-100 group-hover:scale-105">
            <div className="flex flex-col items-center justify-center text-emerald-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
          <span className="mt-1.5 text-[11px] sm:text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors leading-tight">
            More{"\n"}Categories
          </span>
        </button>
      </div>
    </section>
  );
}

export default CategoryGrid;
