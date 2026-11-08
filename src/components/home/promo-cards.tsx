import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

export function PromoCards() {
  return (
    <section className="flex overflow-x-auto no-scrollbar scroll-touch-x md:grid md:grid-cols-3 gap-3 sm:gap-4 pb-1 md:pb-0">
      {/* Card 1: Pharmacy */}
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 p-4 sm:p-5 text-white shadow-[0_4px_16px_rgba(13,148,136,0.15)] hover:shadow-[0_12px_28px_rgba(13,148,136,0.25)] transition-all duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink">
        <div className="pr-24 sm:pr-28 z-10">
          <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-teal-100 mb-1">
            24/7 Wellness
          </span>
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
            className="inline-flex items-center gap-1 rounded-full bg-white text-teal-800 font-black text-[11px] sm:text-xs px-4 py-2 shadow-sm hover:bg-teal-50 transition active:scale-95 cursor-pointer"
          >
            <span>Order Now</span>
            <span className="text-xs">→</span>
          </Link>
        </div>
        <div className="absolute right-2 bottom-2 top-2 w-24 sm:w-28 overflow-hidden flex items-center justify-end pointer-events-none">
          <ProductImage
            src="/images/banners/pharmacy.jpg"
            alt="Pharmacy"
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-500 border border-white/20"
          />
        </div>
      </div>

      {/* Card 2: Pet care */}
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-4 sm:p-5 text-white shadow-[0_4px_16px_rgba(245,158,11,0.18)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.28)] transition-all duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink">
        <div className="pr-24 sm:pr-28 z-10">
          <span className="inline-block px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-amber-100 mb-1">
            Furry Friends
          </span>
          <h3 className="text-base sm:text-lg font-black leading-tight text-white drop-shadow-xs">
            Pet care supplies at your door
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs text-amber-100 font-medium line-clamp-1 sm:line-clamp-2">
            Pedigree, Whiskas, treats &amp; toys
          </p>
        </div>
        <div className="mt-3 z-10">
          <Link
            href="/category/pet-care"
            className="inline-flex items-center gap-1 rounded-full bg-neutral-900 text-white font-black text-[11px] sm:text-xs px-4 py-2 shadow-sm hover:bg-black transition active:scale-95 cursor-pointer"
          >
            <span>Order Now</span>
            <span className="text-xs">→</span>
          </Link>
        </div>
        <div className="absolute right-2 bottom-2 top-2 w-24 sm:w-28 overflow-hidden flex items-center justify-end pointer-events-none">
          <ProductImage
            src="/images/banners/pet-care.jpg"
            alt="Pet Care"
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-500 border border-white/20"
          />
        </div>
      </div>

      {/* Card 3: Baby care */}
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-4 sm:p-5 text-white shadow-[0_4px_16px_rgba(37,99,235,0.18)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] min-w-[260px] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink">
        <div className="pr-24 sm:pr-28 z-10">
          <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-sky-100 mb-1">
            Super Comfort
          </span>
          <h3 className="text-base sm:text-lg font-black leading-tight text-white drop-shadow-xs">
            No time for a diaper run?
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs text-sky-100 font-medium line-clamp-1 sm:line-clamp-2">
            Pampers, Huggies, gentle wipes &amp; food
          </p>
        </div>
        <div className="mt-3 z-10">
          <Link
            href="/category/baby-care"
            className="inline-flex items-center gap-1 rounded-full bg-white text-blue-800 font-black text-[11px] sm:text-xs px-4 py-2 shadow-sm hover:bg-sky-50 transition active:scale-95 cursor-pointer"
          >
            <span>Order Now</span>
            <span className="text-xs">→</span>
          </Link>
        </div>
        <div className="absolute right-2 bottom-2 top-2 w-24 sm:w-28 overflow-hidden flex items-center justify-end pointer-events-none">
          <ProductImage
            src="/images/banners/baby-care.jpg"
            alt="Baby Care"
            className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-500 border border-white/20"
          />
        </div>
      </div>
    </section>
  );
}

export default PromoCards;
