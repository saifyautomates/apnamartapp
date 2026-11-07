"use client";

export function QuickFeatures() {
  return (
    <section className="bg-white rounded-2xl p-2.5 sm:p-3 border border-neutral-100 shadow-xs">
      <div className="grid grid-cols-4 divide-x divide-neutral-100 text-center">
        {/* Feature 1 */}
        <div className="flex flex-col items-center justify-center px-1">
          <span className="text-lg sm:text-xl mb-0.5">🚚</span>
          <span className="text-[11px] font-black text-[#1c1c1c] leading-tight">Fast Delivery</span>
          <span className="text-[9px] text-neutral-400 font-medium leading-tight">12–15 min</span>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col items-center justify-center px-1">
          <span className="text-lg sm:text-xl mb-0.5">🛡️</span>
          <span className="text-[11px] font-black text-[#1c1c1c] leading-tight">100%</span>
          <span className="text-[9px] text-neutral-400 font-medium leading-tight">Original</span>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col items-center justify-center px-1">
          <span className="text-lg sm:text-xl mb-0.5">🏷️</span>
          <span className="text-[11px] font-black text-[#1c1c1c] leading-tight">Best</span>
          <span className="text-[9px] text-neutral-400 font-medium leading-tight">Prices</span>
        </div>

        {/* Feature 4 */}
        <div className="flex flex-col items-center justify-center px-1">
          <span className="text-lg sm:text-xl mb-0.5">🔄</span>
          <span className="text-[11px] font-black text-[#1c1c1c] leading-tight">Easy</span>
          <span className="text-[9px] text-neutral-400 font-medium leading-tight">Returns</span>
        </div>
      </div>
    </section>
  );
}

export default QuickFeatures;

