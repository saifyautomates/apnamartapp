"use client";

export function QuickFeatures() {
  return (
    <section className="bg-white rounded-3xl p-3 sm:p-4 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
        {/* Feature 1 */}
        <div className="flex items-center gap-2.5 px-2 py-1 sm:py-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-xs font-black text-[#1c1c1c]">12-15 Min Delivery</span>
            <span className="block text-[10px] text-neutral-400 font-medium">Hyperlocal in Kota</span>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex items-center gap-2.5 px-2 py-1 sm:py-0 pt-2 sm:pt-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-xs font-black text-[#1c1c1c]">100% Genuine</span>
            <span className="block text-[10px] text-neutral-400 font-medium">Direct FMCG Brands</span>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex items-center gap-2.5 px-2 py-1 sm:py-0 pt-2 sm:pt-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-xs font-black text-[#1c1c1c]">Best Wholesale Rates</span>
            <span className="block text-[10px] text-neutral-400 font-medium">Up to 35% Savings</span>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="flex items-center gap-2.5 px-2 py-1 sm:py-0 pt-2 sm:pt-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-xs font-black text-[#1c1c1c]">Instant Refunds</span>
            <span className="block text-[10px] text-neutral-400 font-medium">No Questions Asked</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuickFeatures;
