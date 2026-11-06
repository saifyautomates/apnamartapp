export function DiscountBadge({
  percent,
  className = "",
}: {
  percent: number;
  className?: string;
}) {
  if (percent <= 0) return null;
  return (
    <span
      className={`inline-flex items-center rounded-sm bg-[#256fe8] px-1.5 py-0.5 text-[10px] font-black text-white shadow-xs uppercase tracking-tight ${className}`}
    >
      {percent}% OFF
    </span>
  );
}

export function EtaBadge({
  minutes = 8,
  className = "",
}: {
  minutes?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-[#f4f6fb] px-1.5 py-0.5 text-[10px] font-extrabold text-[#333333] ${className}`}
    >
      <span className="text-[11px]">⏱</span> {minutes} MINS
    </span>
  );
}

export function StockBadge({
  inStock,
  className = "",
}: {
  inStock: boolean;
  className?: string;
}) {
  if (inStock) return null;
  return (
    <span
      className={`inline-flex items-center rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-100 uppercase ${className}`}
    >
      Out of Stock
    </span>
  );
}
