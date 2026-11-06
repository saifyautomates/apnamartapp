import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

/**
 * 20 Signature Quick-Commerce FMCG Categories (2 rows of 10).
 * 100% packaged consumer goods only — strictly no raw vegetables or fruits.
 */
export const FMCG_CATEGORIES_ROW_1 = [
  { slug: "paan-corner", name: "Paan\nCorner", img: "/images/categories/paan-corner.jpg", href: "/category/paan-corner" },
  { slug: "dairy-eggs", name: "Dairy, Bread\n& Eggs", img: "/images/categories/dairy-bread.jpg", href: "/category/dairy-eggs" },
  { slug: "staples", name: "Atta, Rice\n& Dal", img: "/images/categories/atta-rice-dal.jpg", href: "/category/staples" },
  { slug: "masala-oil", name: "Edible Oils\n& Ghee", img: "/images/categories/masala-oil.jpg", href: "/category/masala-oil" },
  { slug: "cold-drinks", name: "Cold Drinks\n& Juices", img: "/images/categories/cold-drinks.jpg", href: "/category/cold-drinks" },
  { slug: "snacks", name: "Snacks &\nMunchies", img: "/images/categories/snacks-munchies.jpg", href: "/category/snacks" },
  { slug: "breakfast", name: "Breakfast &\nInstant Food", img: "/images/categories/breakfast-instant.jpg", href: "/category/breakfast" },
  { slug: "sweet-tooth", name: "Sweet\nTooth", img: "/images/categories/sweet-tooth.jpg", href: "/category/sweet-tooth" },
  { slug: "bakery-biscuits", name: "Bakery &\nBiscuits", img: "/images/categories/bakery-biscuits.jpg", href: "/category/bakery-biscuits" },
  { slug: "tea-coffee", name: "Tea, Coffee &\nMilk Drinks", img: "/images/categories/tea-coffee.jpg", href: "/category/tea-coffee" },
];

export const FMCG_CATEGORIES_ROW_2 = [
  { slug: "sauces-spreads", name: "Sauces &\nSpreads", img: "/images/categories/sauces-spreads.jpg", href: "/category/sauces-spreads" },
  { slug: "cleaning-essentials", name: "Cleaning\nEssentials", img: "/images/categories/cleaning-essentials.jpg", href: "/category/cleaning-essentials" },
  { slug: "household", name: "Home &\nHousehold", img: "/images/categories/household.jpg", href: "/category/household" },
  { slug: "personal-care", name: "Personal\nCare", img: "/images/categories/personal-care.jpg", href: "/category/personal-care" },
  { slug: "baby-care", name: "Baby\nCare", img: "/images/categories/baby-care-cat.jpg", href: "/category/baby-care" },
  { slug: "pharma-wellness", name: "Pharma &\nWellness", img: "/images/categories/pharma-wellness.jpg", href: "/category/pharma-wellness" },
  { slug: "organic-healthy", name: "Organic &\nHealthy Living", img: "/images/categories/organic-healthy.jpg", href: "/category/organic-healthy" },
  { slug: "beverages", name: "Energy Drinks\n& Beverages", img: "/images/categories/beverages.jpg", href: "/category/beverages" },
  { slug: "home-office", name: "Home &\nOffice", img: "/images/categories/home-office.jpg", href: "/category/home-office" },
  { slug: "pet-care", name: "Pet\nCare", img: "/images/categories/pet-care-cat.jpg", href: "/category/pet-care" },
];

export function CategoryGrid() {
  return (
    <section className="space-y-4 pt-2">
      {/* Row 1 (FMCG Food & Staples) */}
      <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
        {FMCG_CATEGORIES_ROW_1.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            className="group flex flex-col items-center text-center cursor-pointer"
          >
            <div className="h-18 w-18 sm:h-22 sm:w-22 rounded-2xl bg-[#f4f6fb] group-hover:bg-[#e9f0fa] transition-all duration-200 flex items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105">
              <ProductImage
                src={cat.img}
                alt={cat.name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="mt-2 text-[11px] sm:text-xs font-semibold text-[#1c1c1c] leading-tight whitespace-pre-line group-hover:text-[#0c831f] transition min-h-[2rem]">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Row 2 (FMCG Personal, Home & Baby Care) */}
      <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
        {FMCG_CATEGORIES_ROW_2.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            className="group flex flex-col items-center text-center cursor-pointer"
          >
            <div className="h-18 w-18 sm:h-22 sm:w-22 rounded-2xl bg-[#f4f6fb] group-hover:bg-[#e9f0fa] transition-all duration-200 flex items-center justify-center p-2 shadow-xs group-hover:shadow-sm group-hover:scale-105">
              <ProductImage
                src={cat.img}
                alt={cat.name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="mt-2 text-[11px] sm:text-xs font-semibold text-[#1c1c1c] leading-tight whitespace-pre-line group-hover:text-[#0c831f] transition min-h-[2rem]">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;
