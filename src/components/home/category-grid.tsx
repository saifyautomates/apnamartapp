import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

export const CATEGORIES_ROW_1 = [
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

export const CATEGORIES_ROW_2 = [
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

export function CategoryGrid() {
  return (
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
  );
}

export default CategoryGrid;
