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
}

const DEFAULT_12_CATEGORIES: CategoryCardData[] = [
  {
    id: "cat-1",
    name: "Snacks & Namkeen",
    slug: "snacks",
    image: "/images/products/lays-classic-salted-potato-chips.jpg",
  },
  {
    id: "cat-2",
    name: "Beverages",
    slug: "cold-drinks",
    image: "/images/products/coca-cola-original-soft-drink.jpg",
  },
  {
    id: "cat-3",
    name: "Personal Care",
    slug: "personal-care",
    image: "/images/products/dove-cream-beauty-bathing-bar.jpg",
  },
  {
    id: "cat-4",
    name: "Household Essentials",
    slug: "cleaning-essentials",
    image: "/images/products/surf-excel-easy-wash-detergent-powder.jpg",
  },
  {
    id: "cat-5",
    name: "Dairy & Breakfast",
    slug: "dairy-eggs",
    image: "/images/products/amul-butter-pasteurised.jpg",
  },
  {
    id: "cat-6",
    name: "Packaged Foods",
    slug: "breakfast",
    image: "/images/products/maggi-2-minute-instant-noodles.jpg",
  },
  {
    id: "cat-7",
    name: "Health & Wellness",
    slug: "pharma-wellness",
    image: "/images/products/dettol-original-germ-protection-liquid-handwash.jpg",
  },
  {
    id: "cat-8",
    name: "Baby Care",
    slug: "baby-care",
    image: "/images/products/himalaya-baby-massage-oil.jpg",
  },
  {
    id: "cat-9",
    name: "Cleaning Supplies",
    slug: "cleaning-essentials",
    image: "/images/products/vim-dishwash-bar.jpg",
  },
  {
    id: "cat-10",
    name: "Frozen Foods",
    slug: "sweet-tooth",
    image: "/images/products/mother-dairy-classic-curd.jpg",
  },
  {
    id: "cat-11",
    name: "Pet Care",
    slug: "pet-care",
    image: "/images/products/pedigree-adult-dry-dog-food.jpg",
  },
  {
    id: "cat-12",
    name: "Others",
    slug: "staples",
    image: "/images/products/tata-salt-iodized.jpg",
  },
];

export function CategoriesScreenView({
  initialCategories = [],
}: {
  initialCategories?: CategoryCardData[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = initialCategories.length > 0 ? initialCategories : DEFAULT_12_CATEGORIES;

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery, categories]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Mobile Top Header matching Mockup Screen 3: "← Categories" + Search Input */}
      <div className="sm:hidden -mx-3 -mt-2.5 bg-gradient-to-b from-[#032e16] via-[#063b1e] to-[#074724] text-white px-4 pt-3.5 pb-4 space-y-3 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-base font-black text-white hover:text-[#a3e635] transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            <span>Categories</span>
          </button>
          <button
            onClick={() => {
              const input = document.getElementById("category-search-input-mobile");
              input?.focus();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white active:scale-90 transition cursor-pointer"
            aria-label="Search"
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
            id="category-search-input-mobile"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-2xl border border-white/20 bg-white text-xs text-[#1c1c1c] font-medium placeholder-neutral-400 pl-10 pr-4 py-2.5 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition shadow-sm"
          />
        </div>
      </div>

      {/* Desktop Header Row (>= sm) */}
      <div className="hidden sm:flex items-center justify-between py-2 border-b border-neutral-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-lg font-black text-[#1c1c1c] hover:text-[#0c831f] transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          <span>All Categories</span>
        </button>

        <div className="relative w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 pl-10 pr-4 py-2 text-xs text-[#1c1c1c] font-medium placeholder-neutral-400 focus:bg-white focus:border-[#0c831f] focus:outline-hidden transition shadow-xs"
          />
        </div>
      </div>

      {/* 3-Column Clean Card Grid (Screen 3 Mockup) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 pt-1">
        {filteredCategories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="group flex flex-col items-center justify-between text-center rounded-2xl border border-neutral-100 bg-white p-3 shadow-xs hover:border-[#0c831f] hover:shadow-md transition duration-200 active:scale-95 cursor-pointer min-h-[140px]"
          >
            {/* Centered Studio Product Image */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center my-auto">
              <Image
                src={c.image}
                alt={c.name}
                fill
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                unoptimized
              />
            </div>

            {/* Category Title below */}
            <span className="mt-2 text-[11px] sm:text-xs font-black text-neutral-800 leading-tight line-clamp-2">
              {c.name}
            </span>
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

