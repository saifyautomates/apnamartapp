import { formatPaise } from "@/lib/money";

export function Price({ paise, className = "" }: { paise: number; className?: string }) {
  return <span className={`font-bold text-ink ${className}`}>{formatPaise(paise)}</span>;
}

export function Mrp({ paise, className = "" }: { paise: number; className?: string }) {
  return <span className={`text-xs text-muted line-through font-normal ${className}`}>{formatPaise(paise)}</span>;
}

export function DiscountBadge({ percent, className = "" }: { percent: number; className?: string }) {
  if (percent <= 0) return null;
  return (
    <span className={`inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 uppercase tracking-tight ${className}`}>
      {percent}% OFF
    </span>
  );
}

export function EtaBadge({ minutes = 10, className = "" }: { minutes?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 ${className}`}>
      <span className="text-amber-500">⚡</span> {minutes} MINS
    </span>
  );
}

export function SectionTitle({
  title,
  subtitle,
  href,
  actionText = "see all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  actionText?: string;
}) {
  return (
    <div className="mb-3.5 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl flex items-center gap-2">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted sm:text-sm font-medium">{subtitle}</p> : null}
      </div>
      {href ? (
        <a href={href} className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline capitalize flex items-center gap-0.5">
          {actionText} →
        </a>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-2xl mb-3">
        🛒
      </div>
      <p className="font-bold text-ink text-base">{title}</p>
      {body ? <p className="mt-1 text-sm text-muted max-w-sm mx-auto">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-emerald-600 font-semibold">{sub}</p> : null}
    </div>
  );
}
