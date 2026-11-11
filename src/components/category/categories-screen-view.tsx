"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CategoryCardData {
  id: string;
  name: string;
  slug: string;
  image: string;
  subcategoriesText?: string;
  brandsText?: string;
  productCount?: string;
}

const DEFAULT_16_CATEGORIES: CategoryCardData[] = [
  {
    id: "cat-1",
    name: "Snacks & Namkeen",
    slug: "snacks",
    image: "/images/products/lays-classic-salted-potato-chips.jpg",
    subcategoriesText: "Chips, Namkeen, Bhujia, Nachos",
    brandsText: "Lay's, Haldiram's, Kurkure, Bingo",
    productCount: "120+ Products",
  },
  {
    id: "cat-2",
    name: "Biscuits & Cookies",
    slug: "snacks",
    image: "/images/products/cadbury-oreo-vanilla-creme-biscuit.jpg",
    subcategoriesText: "Cookies, Cream Biscuits, Rusks",
    brandsText: "Britannia, Parle, Oreo, Sunfeast",
    productCount: "85+ Products",
  },
  {
    id: "cat-3",
    name: "Chocolates & Sweets",
    slug: "sweet-tooth",
    image: "/images/products/cadbury-dairy-milk-chocolate.jpg",
    subcategoriesText: "Chocolates, Candies, Gifting Packs",
    brandsText: "Cadbury, Nestlé, Amul, Ferrero",
    productCount: "70+ Products",
  },
  {
    id: "cat-4",
    name: "Beverages",
    slug: "cold-drinks",
    image: "/images/products/coca-cola-original-soft-drink.jpg",
    subcategoriesText: "Cold Drinks, Juices, Tea & Coffee",
    brandsText: "Coca-Cola, Pepsi, Real, Red Bull",
    productCount: "95+ Products",
  },
  {
    id: "cat-5",
    name: "Personal Care",
    slug: "personal-care",
    image: "/images/products/dove-cream-beauty-bathing-bar.jpg",
    subcategoriesText: "Soaps, Body Wash, Oral Care",
    brandsText: "Dove, Dettol, Colgate, Nivea",
    productCount: "140+ Products",
  },
  {
    id: "cat-6",
    name: "Hair Care",
    slug: "personal-care",
    image: "/images/products/head-shoulders-anti-dandruff-shampoo.jpg",
    subcategoriesText: "Shampoos, Conditioners, Hair Oil",
    brandsText: "Head & Shoulders, Pantene, Parachute",
    productCount: "65+ Products",
  },
  {
    id: "cat-7",
    name: "Skin Care",
    slug: "personal-care",
    image: "/images/products/nivea-soft-light-moisturizer.jpg",
    subcategoriesText: "Creams, Lotions, Face Wash",
    brandsText: "Nivea, Pond's, Garnier, Himalaya",
    productCount: "75+ Products",
  },
  {
    id: "cat-8",
    name: "Home Care",
    slug: "cleaning-essentials",
    image: "/images/products/godrej-aer-pocket-bathroom-fragrance.jpg",
    subcategoriesText: "Air Fresheners, Repellents, Tissues",
    brandsText: "Godrej aer, Odonil, Goodknight",
    productCount: "50+ Products",
  },
  {
    id: "cat-9",
    name: "Cleaning Supplies",
    slug: "cleaning-essentials",
    image: "/images/products/vim-dishwash-bar.jpg",
    subcategoriesText: "Dishwash, Floor & Toilet Cleaners",
    brandsText: "Vim, Harpic, Lizol, Scotch-Brite",
    productCount: "80+ Products",
  },
  {
    id: "cat-10",
    name: "Dairy & Breakfast",
    slug: "dairy-eggs",
    image: "/images/products/amul-butter-pasteurised.jpg",
    subcategoriesText: "Milk, Butter, Curd, Bread, Paneer",
    brandsText: "Amul, Mother Dairy, Britannia",
    productCount: "90+ Products",
  },
  {
    id: "cat-11",
    name: "Packaged Foods",
    slug: "breakfast",
    image: "/images/products/maggi-2-minute-instant-noodles.jpg",
    subcategoriesText: "Instant Noodles, Pasta, Ketchup",
    brandsText: "Maggi, Knorr, Chings, Kissan",
    productCount: "110+ Products",
  },
  {
    id: "cat-12",
    name: "Staples",
    slug: "staples",
    image: "/images/products/aashirvaad-shudh-chakki-atta.jpg",
    subcategoriesText: "Atta, Rice, Dal, Cooking Oil, Salt",
    brandsText: "Aashirvaad, Fortune, Tata, India Gate",
    productCount: "160+ Products",
  },
  {
    id: "cat-13",
    name: "Baby Care",
    slug: "baby-care",
    image: "/images/products/himalaya-baby-massage-oil.jpg",
    subcategoriesText: "Diapers, Baby Wipes, Baby Lotion",
    brandsText: "Pampers, MamyPoko, Himalaya Baby",
    productCount: "45+ Products",
  },
  {
    id: "cat-14",
    name: "Health & Wellness",
    slug: "pharma-wellness",
    image: "/images/products/dettol-original-germ-protection-liquid-handwash.jpg",
    subcategoriesText: "First Aid, Pain Relief, Sanitizers",
    brandsText: "Dettol, Dabur, Moov, Vicks",
    productCount: "60+ Products",
  },
  {
    id: "cat-15",
    name: "Household Essentials",
    slug: "cleaning-essentials",
    image: "/images/products/surf-excel-easy-wash-detergent-powder.jpg",
    subcategoriesText: "Laundry Detergent, Foil, Bags",
    brandsText: "Surf Excel, Tide, Freshwrapp",
    productCount: "55+ Products",
  },
  {
    id: "cat-16",
    name: "Pet Care",
    slug: "pet-care",
    image: "/images/products/pedigree-adult-dry-dog-food.jpg",
    subcategoriesText: "Dog Food, Cat Food, Treats",
    brandsText: "Pedigree, Whiskas, Drools",
    productCount: "35+ Products",
  },
];

export function CategoriesScreenView({
  initialCategories = [],
}: {
  initialCategories?: CategoryCardData[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = initialCategories.length > 0 ? initialCategories : DEFAULT_16_CATEGORIES;

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery, categories]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Top Header matching Mockup Screen 3: "← Categories" + Search Icon */}
      <div className="flex items-center justify-between py-2 border-b border-neutral-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-black text-[#1c1c1c] hover:text-[#0c831f] transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          <span>Categories</span>
        </button>

        <button
          onClick={() => {
            const input = document.getElementById("category-search-input");
            input?.focus();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:text-[#0c831f] hover:bg-neutral-200 transition cursor-pointer"
          aria-label="Focus search categories"
        >
          <Search className="w-4 h-4 stroke-[2.4]" />
        </button>
      </div>

      {/* Search Input Box: "Search categories..." */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="category-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full rounded-2xl border border-neutral-200/90 bg-neutral-50/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1c1c1c] font-medium placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-neutral-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* 16 Premium FMCG Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
        {filteredCategories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="group flex flex-col justify-between rounded-3xl border border-neutral-100 bg-white p-3.5 shadow-xs hover:border-[#0c831f] hover:shadow-md transition duration-200 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                {c.productCount || "Popular"}
              </span>
              <span className="text-xs text-neutral-300 group-hover:text-[#0c831f] transition-colors">
                ›
              </span>
            </div>

            {/* Centered Studio Product Image Pedestal */}
            <div className="relative h-24 w-full sm:h-28 flex items-center justify-center my-1.5 bg-neutral-50/50 rounded-2xl p-2 group-hover:bg-emerald-50/30 transition-colors">
              <Image
                src={c.image}
                alt={c.name}
                fill
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                unoptimized
              />
            </div>

            {/* Category Title & FMCG Subtitle */}
            <div className="mt-1">
              <h3 className="text-xs sm:text-sm font-black text-neutral-800 leading-snug line-clamp-1 group-hover:text-[#0c831f] transition-colors">
                {c.name}
              </h3>
              {c.subcategoriesText && (
                <p className="text-[10px] text-neutral-400 font-medium line-clamp-1 mt-0.5">
                  {c.subcategoriesText}
                </p>
              )}
              {c.brandsText && (
                <p className="text-[9px] text-neutral-500 font-bold line-clamp-1 mt-0.5">
                  {c.brandsText}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-sm font-semibold text-neutral-400">
          No categories found matching &ldquo;{searchQuery}&rdquo;
        </div>
      )}
    </div>
  );
}

export default CategoriesScreenView;

