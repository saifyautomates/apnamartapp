import Link from "next/link";
import { InstallAppLink } from "@/components/pwa";
import { CentralMartLogo } from "@/components/ui/logo";
import { MapPin, Phone, Zap, Tag, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200/80 bg-white hidden sm:block">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-neutral-100">
          <div>
            <div className="mb-2">
              <CentralMartLogo size="sm" showBadge />
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed mt-2">
              Central Mart · Kota&apos;s #1 Online Supermarket located at <strong>80 Feet Road, Kota, Rajasthan</strong>. Delivering 100% genuine packaged FMCG staples, dairy, snacks, beverages, cleaning &amp; personal care across Kota with reliable same-day doorstep delivery.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-600">
              <MapPin className="w-3.5 h-3.5 text-[#0c831f] shrink-0" />
              <span>80 Feet Road, Kota, Rajasthan - 324005</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
              <Phone className="w-3.5 h-3.5 text-[#0c831f] shrink-0" />
              <span>+91 98290 12345 · Daily 8:00 AM - 10:00 PM</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1c1c1c] uppercase tracking-wider mb-3">Popular Categories</h4>
            <ul className="space-y-1.5 text-xs text-neutral-600 font-medium">
              <li><Link href="/category/dairy-eggs" className="hover:text-[#0c831f] transition">Dairy, Bread &amp; Eggs</Link></li>
              <li><Link href="/category/staples" className="hover:text-[#0c831f] transition">Atta, Rice &amp; Dal</Link></li>
              <li><Link href="/category/snacks" className="hover:text-[#0c831f] transition">Snacks &amp; Munchies</Link></li>
              <li><Link href="/category/cold-drinks" className="hover:text-[#0c831f] transition">Cold Drinks &amp; Juices</Link></li>
              <li><Link href="/category/cleaning-essentials" className="hover:text-[#0c831f] transition">Cleaning Essentials</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1c1c1c] uppercase tracking-wider mb-3">Customer Service</h4>
            <ul className="space-y-1.5 text-xs text-neutral-600 font-medium">
              <li><Link href="/orders" className="hover:text-[#0c831f] transition">My Orders</Link></li>
              <li><Link href="/account" className="hover:text-[#0c831f] transition">My Profile</Link></li>
              <li><Link href="/cart" className="hover:text-[#0c831f] transition">View Cart</Link></li>
              <li><Link href="/staff-login" className="hover:text-[#0c831f] transition">Staff Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1c1c1c] uppercase tracking-wider mb-3">Why Shop With Us?</h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 fill-[#0c831f] text-[#0c831f]" />
                <span className="font-bold text-[#1c1c1c]">Same-Day Doorstep Delivery</span>
              </li>
              <li className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#0c831f]" />
                <span>Best Prices &amp; Daily Offers</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0c831f]" />
                <span>100% Genuine Branded Products</span>
              </li>
            </ul>
            <div className="mt-4">
              <InstallAppLink />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Central Mart · Powered by Grocery Commerce Platform.</p>
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

