import { prisma } from "@/lib/prisma";
import ProductCarousel from "@/components/product-carousel";
import { VariantCardProps } from "@/components/product-card";
import { ProductImage } from "@/components/shop";
import Link from "next/link";

// Exact 20 categories from Blinkit screenshots
const CATEGORIES_ROW_1 = [
  { slug: "paan-corner", name: "Paan\nCorner", img: "/images/categories/paan-corner.jpg", href: "/category/paan-corner" },
  { slug: "dairy-eggs", name: "Dairy, Bread\n& Eggs", img: "/images/categories/dairy-bread.jpg", href: "/category/dairy-eggs" },
  { slug: "fruits-vegetables", name: "Fruits &\nVegetables", img: "/images/categories/fruits-vegetables.jpg", href: "/category/fruits-vegetables" },
  { slug: "cold-drinks", name: "Cold Drinks\n& Juices", img: "/images/categories/cold-drinks.jpg", href: "/category/cold-drinks" },
  { slug: "snacks", name: "Snacks &\nMunchies", img: "/images/categories/snacks-munchies.jpg", href: "/category/snacks" },
  { slug: "breakfast", name: "Breakfast &\nInstant Food", img: "/images/categories/breakfast-instant.jpg", href: "/category/breakfast" },
  { slug: "sweet-tooth", name: "Sweet\nTooth", img: "/images/categories/sweet-tooth.jpg", href: "/category/sweet-tooth" },
  { slug: "bakery-biscuits", name: "Bakery &\nBiscuits", img: "/images/categories/bakery-biscuits.jpg", href: "/category/bakery-biscuits" },
  { slug: "tea-coffee", name: "Tea, Coffee &\nMilk Drinks", img: "/images/categories/tea-coffee.jpg", href: "/category/tea-coffee" },
  { slug: "staples", name: "Atta, Rice\n& Dal", img: "/images/categories/atta-rice-dal.jpg", href: "/category/staples" },
];

const CATEGORIES_ROW_2 = [
  { slug: "masala-oil", name: "Masala, Oil\n& More", img: "/images/categories/masala-oil.jpg", href: "/category/masala-oil" },
  { slug: "sauces-spreads", name: "Sauces &\nSpreads", img: "/images/categories/sauces-spreads.jpg", href: "/category/sauces-spreads" },
  { slug: "chicken-meat", name: "Chicken, Meat\n& Fish", img: "/images/categories/chicken-meat.jpg", href: "/category/chicken-meat" },
  { slug: "organic-healthy", name: "Organic &\nHealthy Living", img: "/images/categories/organic-healthy.jpg", href: "/category/organic-healthy" },
  { slug: "baby-care", name: "Baby\nCare", img: "/images/categories/baby-care-cat.jpg", href: "/category/baby-care" },
  { slug: "pharma-wellness", name: "Pharma &\nWellness", img: "/images/categories/pharma-wellness.jpg", href: "/category/pharma-wellness" },
  { slug: "cleaning-essentials", name: "Cleaning\nEssentials", img: "/images/categories/cleaning-essentials.jpg", href: "/category/cleaning-essentials" },
  { slug: "home-office", name: "Home &\nOffice", img: "/images/categories/home-office.jpg", href: "/category/home-office" },
  { slug: "personal-care", name: "Personal\nCare", img: "/images/categories/personal-care-cat.jpg", href: "/category/personal-care" },
  { slug: "pet-care", name: "Pet\nCare", img: "/images/categories/pet-care-cat.jpg", href: "/category/pet-care" },
];

export default async function HomePage() {
  const [dairyItems, snackItems, drinkItems, stapleItems, deals] = await Promise.all([
    // Dairy & Eggs
    prisma.productVariant.findMany({
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
    }),

    // Snacks & Munchies
    prisma.productVariant.findMany({
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
    }),

    // Cold Drinks & Juices
    prisma.productVariant.findMany({
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
    }),

    // Atta, Rice & Dal (Staples)
    prisma.productVariant.findMany({
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
    }),

    // Deals with discounts
    prisma.productVariant.findMany({
      where: {
        product: { isActive: true, onlineVisible: true, deletedAt: null },
      },
      include: {
        product: { include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        inventory: true,
      },
      take: 30,
    }),
  ]);

  const discountDeals = deals.filter((v) => v.sellingPaise < v.mrpPaise).slice(0, 10);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Hero Big Banner: "Stock up on daily essentials" */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#146b2b] via-[#10782e] to-[#0c831f] text-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center p-5 sm:p-8 md:p-10 gap-6">
          <div className="md:col-span-7 z-10">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Stock up on daily essentials
            </h1>
            <p className="mt-3 text-sm sm:text-base lg:text-lg font-medium text-emerald-100 max-w-xl">
              Get farm-fresh goodness &amp; a range of exotic fruits, vegetables, eggs &amp; more
            </p>
            <div className="mt-5 sm:mt-6">
              <Link
                href="/category/dairy-eggs"
                className="inline-flex items-center justify-center rounded-lg bg-white text-[#1c1c1c] font-black text-sm sm:text-base px-6 py-2.5 sm:py-3 shadow-md hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
              >
                Shop Now
              </Link>
            </div>
          </div>
          <div className="md:col-span-5 relative flex justify-center md:justify-end">
            <div className="relative h-44 sm:h-56 md:h-64 w-full max-w-md rounded-2xl overflow-hidden">
              <ProductImage
                src="/images/banners/hero-groceries.jpg"
                alt="Stock up on daily essentials"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Promotional Cards Row: Pharmacy, Pet care, Baby care */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Pharmacy */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#009688] to-[#00796b] p-5 text-white shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="pr-28 z-10">
            <h3 className="text-lg sm:text-xl font-black leading-tight text-white">
              Pharmacy at your doorstep!
            </h3>
            <p className="mt-1 text-xs text-teal-100 font-medium">
              Cough syrups, pain relief sprays &amp; more
            </p>
          </div>
          <div className="mt-4 z-10">
            <Link
              href="/category/pharma-wellness"
              className="inline-block rounded-lg bg-white text-[#00796b] font-black text-xs px-4 py-2 shadow-sm hover:bg-teal-50 transition active:scale-95"
            >
              Order Now
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-32 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
            <ProductImage
              src="/images/banners/pharmacy.jpg"
              alt="Pharmacy"
              className="h-28 w-28 object-cover rounded-xl shadow-md"
            />
          </div>
        </div>

        {/* Card 2: Pet care */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f8cb46] to-[#e5b328] p-5 text-[#1c1c1c] shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="pr-28 z-10">
            <h3 className="text-lg sm:text-xl font-black leading-tight text-[#1c1c1c]">
              Pet care supplies at your door
            </h3>
            <p className="mt-1 text-xs text-neutral-800 font-semibold">
              Food, treats, toys &amp; more
            </p>
          </div>
          <div className="mt-4 z-10">
            <Link
              href="/category/pet-care"
              className="inline-block rounded-lg bg-[#1c1c1c] text-white font-black text-xs px-4 py-2 shadow-sm hover:bg-neutral-800 transition active:scale-95"
            >
              Order Now
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-32 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
            <ProductImage
              src="/images/banners/pet-care.jpg"
              alt="Pet Care"
              className="h-28 w-28 object-cover rounded-xl shadow-md"
            />
          </div>
        </div>

        {/* Card 3: Baby care */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#dce8f8] to-[#c7daf1] p-5 text-[#1c1c1c] shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="pr-28 z-10">
            <h3 className="text-lg sm:text-xl font-black leading-tight text-[#1c1c1c]">
              No time for a diaper run?
            </h3>
            <p className="mt-1 text-xs text-neutral-700 font-semibold">
              Get baby care essentials
            </p>
          </div>
          <div className="mt-4 z-10">
            <Link
              href="/category/baby-care"
              className="inline-block rounded-lg bg-[#1c1c1c] text-white font-black text-xs px-4 py-2 shadow-sm hover:bg-neutral-800 transition active:scale-95"
            >
              Order Now
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-32 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
            <ProductImage
              src="/images/banners/baby-care.jpg"
              alt="Baby Care"
              className="h-28 w-28 object-cover rounded-xl shadow-md"
            />
          </div>
        </div>
      </section>

      {/* 3. Blinkit Signature 2-Row Category Grid */}
      <section className="space-y-3 pt-2">
        {/* Row 1 */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-2.5">
          {CATEGORIES_ROW_1.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex flex-col items-center justify-between rounded-xl bg-[#f2f7fc] hover:bg-[#e8f1fc] p-2 sm:p-2.5 transition duration-150 cursor-pointer"
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-200">
                <ProductImage
                  src={cat.img}
                  alt={cat.name}
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <span className="mt-1.5 text-[11px] sm:text-xs font-bold text-[#1c1c1c] text-center leading-tight whitespace-pre-line group-hover:text-[#0c831f] transition">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-2.5">
          {CATEGORIES_ROW_2.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex flex-col items-center justify-between rounded-xl bg-[#f2f7fc] hover:bg-[#e8f1fc] p-2 sm:p-2.5 transition duration-150 cursor-pointer"
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-200">
                <ProductImage
                  src={cat.img}
                  alt={cat.name}
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <span className="mt-1.5 text-[11px] sm:text-xs font-bold text-[#1c1c1c] text-center leading-tight whitespace-pre-line group-hover:text-[#0c831f] transition">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Product Carousel Rails */}
      {/* Rail 1: Dairy, Bread & Eggs */}
      {dairyItems.length > 0 ? (
        <ProductCarousel
          title="Dairy, Bread & Eggs"
          seeAllHref="/category/dairy-eggs"
          items={dairyItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 2: Snacks & Munchies */}
      {snackItems.length > 0 ? (
        <ProductCarousel
          title="Snacks & Munchies"
          seeAllHref="/category/snacks"
          items={snackItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 3: Cold Drinks & Juices */}
      {drinkItems.length > 0 ? (
        <ProductCarousel
          title="Cold Drinks & Juices"
          seeAllHref="/category/cold-drinks"
          items={drinkItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 4: Atta, Rice & Dal */}
      {stapleItems.length > 0 ? (
        <ProductCarousel
          title="Atta, Rice & Dal"
          seeAllHref="/category/staples"
          items={stapleItems as unknown as VariantCardProps[]}
        />
      ) : null}

      {/* Rail 5: Mega Deals & Savings */}
      {discountDeals.length > 0 ? (
        <ProductCarousel
          title="🔥 Best Offers on Groceries"
          seeAllHref="/category"
          items={discountDeals as unknown as VariantCardProps[]}
        />
      ) : null}
    </div>
  );
}
