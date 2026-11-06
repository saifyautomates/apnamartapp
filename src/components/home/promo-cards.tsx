import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

export function PromoCards() {
  return (
    <section className="flex overflow-x-auto snap-x no-scrollbar md:grid md:grid-cols-3 gap-3 sm:gap-4 pb-1 md:pb-0">
      {/* Card 1: Pharmacy */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#009688] to-[#00796b] p-4 sm:p-5 text-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[135px] sm:min-h-[155px] min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink">
        <div className="pr-24 sm:pr-28 z-10">
          <h3 className="text-base sm:text-lg font-black leading-tight text-white drop-shadow-xs">
            Pharmacy at your doorstep!
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs text-teal-100 font-medium line-clamp-1 sm:line-clamp-2">
            Cough syrups, pain relief sprays &amp; more
          </p>
        </div>
        <div className="mt-3 z-10">
          <Link
            href="/category/pharma-wellness"
            className="inline-block rounded-full bg-white text-[#00796b] font-black text-[11px] sm:text-xs px-3.5 py-1.5 shadow-sm hover:bg-teal-50 transition active:scale-95 cursor-pointer"
          >
            Order Now →
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-24 sm:w-28 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
          <ProductImage
            src="/images/banners/pharmacy.jpg"
            alt="Pharmacy"
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Card 2: Pet care */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f8cb46] to-[#e5b328] p-4 sm:p-5 text-[#1c1c1c] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[135px] sm:min-h-[155px] min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink">
        <div className="pr-24 sm:pr-28 z-10">
          <h3 className="text-base sm:text-lg font-black leading-tight text-[#1c1c1c]">
            Pet care supplies at your door
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs text-neutral-800 font-semibold line-clamp-1 sm:line-clamp-2">
            Food, treats, toys &amp; more
          </p>
        </div>
        <div className="mt-3 z-10">
          <Link
            href="/category/pet-care"
            className="inline-block rounded-full bg-[#1c1c1c] text-white font-black text-[11px] sm:text-xs px-3.5 py-1.5 shadow-sm hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
          >
            Order Now →
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-24 sm:w-28 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
          <ProductImage
            src="/images/banners/pet-care.jpg"
            alt="Pet Care"
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Card 3: Baby care */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#dce8f8] to-[#c7daf1] p-4 sm:p-5 text-[#1c1c1c] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[135px] sm:min-h-[155px] min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink">
        <div className="pr-24 sm:pr-28 z-10">
          <h3 className="text-base sm:text-lg font-black leading-tight text-[#1c1c1c]">
            No time for a diaper run?
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs text-neutral-700 font-semibold line-clamp-1 sm:line-clamp-2">
            Get baby care essentials fast
          </p>
        </div>
        <div className="mt-3 z-10">
          <Link
            href="/category/baby-care"
            className="inline-block rounded-full bg-[#1c1c1c] text-white font-black text-[11px] sm:text-xs px-3.5 py-1.5 shadow-sm hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
          >
            Order Now →
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-24 sm:w-28 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
          <ProductImage
            src="/images/banners/baby-care.jpg"
            alt="Baby Care"
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}

export default PromoCards;
