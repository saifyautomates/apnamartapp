import { formatPaise } from "@/lib/money";

export function Price({ paise, className = "" }: { paise: number; className?: string }) {
  return (
    <span className={`font-black text-[#1c1c1c] tracking-tight ${className}`}>
      {formatPaise(paise)}
    </span>
  );
}

export function Mrp({ paise, className = "" }: { paise: number; className?: string }) {
  return (
    <span className={`text-xs text-neutral-400 line-through font-normal ${className}`}>
      {formatPaise(paise)}
    </span>
  );
}

export function Savings({
  mrpPaise,
  sellingPaise,
  className = "",
}: {
  mrpPaise: number;
  sellingPaise: number;
  className?: string;
}) {
  const diff = mrpPaise - sellingPaise;
  if (diff <= 0) return null;
  return (
    <span className={`text-[11px] font-bold text-[#0c831f] ${className}`}>
      Save {formatPaise(diff)}
    </span>
  );
}

