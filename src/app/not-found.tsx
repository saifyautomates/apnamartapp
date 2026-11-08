import Link from "next/link";
import { ShoppingBag, Home, Sparkles } from "lucide-react";

export const metadata = {
  title: "Page Not Found | Central Mart Kota",
  description: "The product or page you are looking for is unavailable. Explore Kota's favorite grocery store at 80 Feet Road.",
};

const POPULAR_CATEGORIES = [
  { name: "Atta, Rice & Dal", href: "/category/staples" },
  { name: "Dairy, Bread & Eggs", href: "/category/dairy" },
  { name: "Snacks & Munchies", href: "/category/snacks" },
  { name: "Cold Drinks & Juices", href: "/category/drinks" },
  { name: "Cleaning & Household", href: "/category/cleaning" },
];

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="max-w-lg w-full text-center">
        {/* Visual Emblem */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-100/80 shadow-inner mb-6">
          <ShoppingBag className="w-12 h-12 sm:w-14 sm:h-14 text-[#0c831f] stroke-[1.8]" />
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-md border-2 border-white">
            404
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
          Item or Page Not Found
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-500 leading-relaxed max-w-md mx-auto">
          The product might be temporarily sold out, or the link may have changed. Browse Kota darkstore essentials below!
        </p>

        {/* Action Buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] px-6 py-3 text-sm font-black text-white shadow-md shadow-emerald-700/20 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Go to Supermarket Home</span>
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 px-5 py-3 text-sm font-bold text-neutral-700 shadow-xs transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-[#0c831f]" />
            <span>View My Cart</span>
          </Link>
        </div>

        {/* Popular Categories Rail */}
        <div className="mt-10 pt-8 border-t border-neutral-200/60 text-left">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-400 mb-3 justify-center sm:justify-start">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Popular Darkstore Aisles in Kota</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-emerald-50 hover:text-[#0c831f] hover:border-emerald-200 border border-transparent text-neutral-600 transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
