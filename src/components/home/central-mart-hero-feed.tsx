"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { openCategoriesModal } from "@/components/category/category-drawer";
import { openSearchModal } from "@/components/search/search-modal";
import { Tag, Grid, RotateCcw, Heart, ArrowRight } from "lucide-react";
import { CentralMartTrustCard } from "@/components/ui/trust-card";

export interface PopularCategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  query: string;
}

const POPULAR_CATEGORIES: PopularCategoryItem[] = [
  {
    id: "cat-snacks",
    name: "Snacks & Namkeen",
    slug: "snacks",
    image: "/images/products/lays-classic-salted-potato-chips.jpg",
    query: "lays kurkure chips namkeen biscuits",
  },
  {
    id: "cat-beverages",
    name: "Beverages",
    slug: "cold-drinks",
    image: "/images/products/coca-cola-original-soft-drink.jpg",
    query: "coca cola pepsi juice cold drink tea coffee",
  },
  {
    id: "cat-personal-care",
    name: "Personal Care",
    slug: "personal-care",
    image: "/images/products/dove-cream-beauty-bathing-bar.jpg",
    query: "soap shampoo cream nivea dove colgate",
  },
  {
    id: "cat-household",
    name: "Household Essentials",
    slug: "cleaning-essentials",
    image: "/images/products/surf-excel-easy-wash-detergent-powder.jpg",
    query: "surf excel tide detergent harpic cleaner",
  },
  {
    id: "cat-dairy",
    name: "Dairy & Breakfast",
    slug: "dairy-eggs",
    image: "/images/products/amul-butter-pasteurised.jpg",
    query: "milk butter curd paneer amul bread",
  },
  {
    id: "cat-packaged",
    name: "Packaged Foods",
    slug: "breakfast",
    image: "/images/products/maggi-2-minute-instant-noodles.jpg",
    query: "maggi noodles pasta ketchup sauces",
  },
];

export function CentralMartHeroFeed() {
  return (
    <div className="space-y-4">
      {/* 1. Promo Card matching Mockup Screen 2 (Up to 50% OFF on FMCG Products) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#042c16] via-[#064221] to-[#0a582c] p-5 sm:p-7 text-white shadow-lg border border-emerald-800/40">
        {/* Background Decorative Rings */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-lime-400/10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="max-w-[62%] sm:max-w-md space-y-2">
            <span className="inline-block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-200">
              Up to
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#facc15] tracking-tight leading-none drop-shadow-xs">
              50% OFF
            </h2>
            <p className="text-xs sm:text-sm font-bold text-white/95 leading-tight">
              on FMCG Products
            </p>
            <div className="pt-1.5 flex items-center gap-2 flex-wrap">
              <Link
                href="/category"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] px-4 py-2 text-xs sm:text-sm font-black text-white shadow-md active:scale-95 transition cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* FMCG Product Packshots Collage */}
          <div className="relative h-28 w-28 sm:h-36 sm:w-44 shrink-0 flex items-center justify-center">
            {/* Visual Packshots Layering */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -left-3 bottom-0 h-20 w-16 sm:h-26 sm:w-20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-xs p-1 shadow-md -rotate-6">
                <Image
                  src="/images/products/lays-classic-salted-potato-chips.jpg"
                  alt="Lay's FMCG"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div className="relative z-10 h-24 w-20 sm:h-32 sm:w-24 rounded-2xl overflow-hidden bg-white/15 backdrop-blur-xs p-1 shadow-xl">
                <Image
                  src="/images/products/coca-cola-original-soft-drink.jpg"
                  alt="Coca-Cola FMCG"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div className="absolute -right-3 bottom-0 h-20 w-16 sm:h-26 sm:w-20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-xs p-1 shadow-md rotate-6">
                <Image
                  src="/images/products/dove-cream-beauty-bathing-bar.jpg"
                  alt="Dove FMCG"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 Quick Action Rounded Tiles matching Mockup Screen 2 (Offers, Categories, Reorder, Wishlist) */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
        {/* Action 1: Offers */}
        <Link
          href="/#deals"
          className="group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-xs hover:border-orange-300 hover:shadow-sm transition active:scale-95 cursor-pointer"
        >
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 mb-1.5 group-hover:scale-105 transition">
            <Tag className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] sm:text-xs font-black text-neutral-800 tracking-tight">
            Offers
          </span>
        </Link>

        {/* Action 2: Categories */}
        <Link
          href="/category"
          className="group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-xs hover:border-emerald-300 hover:shadow-sm transition active:scale-95 cursor-pointer"
        >
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#0c831f] mb-1.5 group-hover:scale-105 transition">
            <Grid className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] sm:text-xs font-black text-neutral-800 tracking-tight">
            Categories
          </span>
        </Link>

        {/* Action 3: Reorder */}
        <Link
          href="/orders"
          className="group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-xs hover:border-emerald-300 hover:shadow-sm transition active:scale-95 cursor-pointer"
        >
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#0c831f] mb-1.5 group-hover:scale-105 transition">
            <RotateCcw className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] sm:text-xs font-black text-neutral-800 tracking-tight">
            Reorder
          </span>
        </Link>

        {/* Action 4: Wishlist */}
        <Link
          href="/wishlist"
          className="group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-xs hover:border-emerald-300 hover:shadow-sm transition active:scale-95 cursor-pointer"
        >
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#0c831f] mb-1.5 group-hover:scale-105 transition">
            <Heart className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] sm:text-xs font-black text-neutral-800 tracking-tight">
            Wishlist
          </span>
        </Link>
      </div>

      {/* 2.5 Exact 4-Badge Central Mart Trust Card (Matching User's Attached Image 1) */}
      <CentralMartTrustCard />

      {/* 3. Popular Categories Section matching Mockup Screen 2 */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-[#1c1c1c] tracking-tight">
            Popular Categories
          </h3>
          <Link
            href="/category"
            className="text-xs sm:text-sm font-bold text-[#0c831f] hover:text-[#0a701a] flex items-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <span>See All</span>
            <span className="text-xs">›</span>
          </Link>
        </div>

        {/* Categories Grid matching Clean White Cards in Screen 2 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3.5">
          {POPULAR_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-white border border-neutral-100 shadow-xs hover:border-emerald-300 hover:shadow-sm transition active:scale-95 cursor-pointer"
            >
              <div className="relative h-18 w-18 sm:h-22 sm:w-22 mb-1.5 flex items-center justify-center">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-contain p-1 group-hover:scale-105 transition duration-200"
                  unoptimized
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-neutral-800 leading-tight line-clamp-2">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CentralMartHeroFeed;
