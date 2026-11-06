import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

export function PromoCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {/* Card 1: Pharmacy */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#009688] to-[#00796b] p-5 text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
        <div className="pr-28 z-10">
          <h3 className="text-lg sm:text-xl font-black leading-tight text-white drop-shadow-xs">
            Pharmacy at your doorstep!
          </h3>
          <p className="mt-1 text-xs text-teal-100 font-medium">
            Cough syrups, pain relief sprays &amp; more
          </p>
        </div>
        <div className="mt-4 z-10">
          <Link
            href="/category/pharma-wellness"
            className="inline-block rounded-lg bg-white text-[#00796b] font-black text-xs px-4 py-2 shadow-sm hover:bg-teal-50 hover:shadow-md transition active:scale-95 cursor-pointer"
          >
            Order Now
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-32 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
          <ProductImage
            src="/images/banners/pharmacy.jpg"
            alt="Pharmacy"
            className="h-28 w-28 object-cover rounded-xl shadow-md group-hover:scale-108 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Card 2: Pet care */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f8cb46] to-[#e5b328] p-5 text-[#1c1c1c] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
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
            className="inline-block rounded-lg bg-[#1c1c1c] text-white font-black text-xs px-4 py-2 shadow-sm hover:bg-neutral-800 hover:shadow-md transition active:scale-95 cursor-pointer"
          >
            Order Now
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-32 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
          <ProductImage
            src="/images/banners/pet-care.jpg"
            alt="Pet Care"
            className="h-28 w-28 object-cover rounded-xl shadow-md group-hover:scale-108 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Card 3: Baby care */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#dce8f8] to-[#c7daf1] p-5 text-[#1c1c1c] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
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
            className="inline-block rounded-lg bg-[#1c1c1c] text-white font-black text-xs px-4 py-2 shadow-sm hover:bg-neutral-800 hover:shadow-md transition active:scale-95 cursor-pointer"
          >
            Order Now
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-32 overflow-hidden flex items-center justify-end p-2 pointer-events-none">
          <ProductImage
            src="/images/banners/baby-care.jpg"
            alt="Baby Care"
            className="h-28 w-28 object-cover rounded-xl shadow-md group-hover:scale-108 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}

export default PromoCards;
