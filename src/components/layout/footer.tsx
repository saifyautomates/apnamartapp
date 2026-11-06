import Link from "next/link";
import { InstallAppLink } from "@/components/pwa";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200/80 bg-white hidden sm:block">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-2xl font-black tracking-tight font-sans">
                <span className="text-[#f8cb46]">blink</span>
                <span className="text-[#0c831f]">it</span>
              </span>
              <span className="rounded-full bg-[#f8cb46] text-[#1c1c1c] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                8 mins
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              India&apos;s last minute app. Delivering groceries, fresh staples, dairy, snacks, and household essentials in 8 minutes.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-3">Popular Categories</h4>
            <ul className="space-y-1.5 text-xs text-neutral-600 font-medium">
              <li><Link href="/category/dairy-eggs" className="hover:text-[#0c831f] transition">Dairy, Bread &amp; Eggs</Link></li>
              <li><Link href="/category/staples" className="hover:text-[#0c831f] transition">Atta, Rice &amp; Dal</Link></li>
              <li><Link href="/category/snacks" className="hover:text-[#0c831f] transition">Snacks &amp; Munchies</Link></li>
              <li><Link href="/category/cold-drinks" className="hover:text-[#0c831f] transition">Cold Drinks &amp; Juices</Link></li>
              <li><Link href="/category/cleaning-essentials" className="hover:text-[#0c831f] transition">Cleaning Essentials</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-3">Customer Service</h4>
            <ul className="space-y-1.5 text-xs text-neutral-600 font-medium">
              <li><Link href="/orders" className="hover:text-[#0c831f] transition">My Orders</Link></li>
              <li><Link href="/account" className="hover:text-[#0c831f] transition">My Profile</Link></li>
              <li><Link href="/cart" className="hover:text-[#0c831f] transition">View Cart</Link></li>
              <li><Link href="/staff-login" className="hover:text-[#0c831f] transition">Staff &amp; Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-3">Why Shop With Us?</h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">⚡</span>
                <span className="font-bold text-[#1c1c1c]">Superfast 8 Mins Delivery</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#0c831f] font-bold">🏷️</span>
                <span>Best Prices &amp; Daily Offers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">💯</span>
                <span>100% Genuine Branded Products</span>
              </li>
            </ul>
            <div className="mt-4">
              <InstallAppLink />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Blinkit Clone · Powered by Grocery Commerce Platform.</p>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#1c1c1c]">Accepted Payments:</span>
            <span>UPI · Google Pay · PhonePe · Cards · Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
