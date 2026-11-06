import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

export interface HeroBannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  href?: string;
  imageSrc?: string;
}

export function HeroBanner({
  title = "Stock up on daily essentials",
  subtitle = "Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more",
  buttonText = "Shop Now",
  href = "/category/dairy-eggs",
  imageSrc = "/images/banners/hero-groceries.jpg",
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#146b2b] via-[#10782e] to-[#0c831f] text-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 items-center p-5 sm:p-8 md:p-10 gap-6">
        <div className="md:col-span-7 z-10">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm sm:text-base lg:text-lg font-medium text-emerald-100 max-w-xl">
            {subtitle}
          </p>
          <div className="mt-5 sm:mt-6">
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-lg bg-white text-[#1c1c1c] font-black text-sm sm:text-base px-6 py-2.5 sm:py-3 shadow-md hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
            >
              {buttonText}
            </Link>
          </div>
        </div>
        <div className="md:col-span-5 relative flex justify-center md:justify-end">
          <div className="relative h-44 sm:h-56 md:h-64 w-full max-w-md rounded-2xl overflow-hidden shadow-lg">
            <ProductImage
              src={imageSrc}
              alt={title}
              className="h-full w-full object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;

