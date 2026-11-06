import { formatPaise } from "@/lib/money";

/**
 * Admin display primitives + inline SVG charts (preview design language:
 * white cards, soft shadows, fresh green #15803d primary, charcoal text).
 * Pure presentational components — every number passed in must already be a
 * real Prisma aggregate computed by the calling page. Nothing here invents
 * data, and no chart library is introduced.
 */

export function AdminCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-adminline bg-white p-4 shadow-sm ${className}`}>
      {title ? (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-bold">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: "bg-green-100 text-green-800",
  OUT_FOR_DELIVERY: "bg-emerald-100 text-emerald-800",
  PACKED: "bg-lime-100 text-lime-800",
  PREPARING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PLACED: "bg-slate-100 text-slate-800",
  PENDING_PAYMENT: "bg-slate-100 text-slate-800",
  CANCELLED: "bg-red-100 text-red-800",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  REFUND_PENDING: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-violet-100 text-violet-800",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-800"}`}>
      {label}
    </span>
  );
}

function fmtCompact(paise: number): string {
  if (paise >= 10000000) return `₹${(paise / 10000000).toFixed(1)}Cr`;
  if (paise >= 100000) return `₹${(paise / 100000).toFixed(1)}L`;
  if (paise >= 1000) return `₹${Math.round(paise / 1000)}k`;
  return formatPaise(paise);
}

/** Revenue trend line chart (inline SVG). points must be one entry per day, oldest first. */
export function RevenueLineChart({ points }: { points: Array<{ label: string; value: number }> }) {
  const w = 560;
  const h = 190;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 26;
  const max = Math.max(1, ...points.map((p) => p.value));
  const x = (i: number) => padL + (i * (w - padL - padR)) / Math.max(1, points.length - 1);
  const y = (v: number) => padT + (h - padT - padB) * (1 - v / max);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `${padL},${h - padB} ${line} ${x(points.length - 1)},${h - padB}`;
  const total = points.reduce((s, p) => s + p.value, 0);
  const labelIdx = points.length > 1 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0];
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Revenue trend chart">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} x2={w - padR} y1={y(max * f)} y2={y(max * f)} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        <polygon points={area} fill="#15803d" opacity="0.08" />
        <polyline points={line} fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#fff" stroke="#15803d" strokeWidth="2" />
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="11" fill="#5c6b60">
            {points[i]?.label ?? ""}
          </text>
        ))}
        <text x={padL} y={12} fontSize="11" fill="#5c6b60">
          Max {fmtCompact(max)}
        </text>
      </svg>
      <p className="mt-1 text-sm text-muted">
        Total received in this window: <strong className="text-ink">{formatPaise(total)}</strong>
        {total === 0 ? " — no captured payments in the last 14 days." : ""}
      </p>
    </div>
  );
}

/** Horizontal bar chart (inline SVG-free, div bars). rows must already be sorted desc. */
export function CategoryBars({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-muted">No sales yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{r.label}</span>
            <span className="text-muted">{formatPaise(r.value)}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-adminbg">
            <div className="h-full rounded-full bg-admin" style={{ width: `${Math.max(2, Math.round((r.value / max) * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS: Record<string, string> = {
  DELIVERED: "#14532d",
  OUT_FOR_DELIVERY: "#15803d",
  PACKED: "#65a30d",
  PREPARING: "#d97706",
  CONFIRMED: "#2563eb",
  PLACED: "#64748b",
  PENDING_PAYMENT: "#94a3b8",
  CANCELLED: "#b3261e",
  PAYMENT_FAILED: "#b3261e",
  REFUND_PENDING: "#ea580c",
  REFUNDED: "#7c3aed",
};

/** Order-status donut (inline SVG, stroke-dasharray technique). */
export function StatusDonut({ slices }: { slices: Array<{ label: string; count: number }> }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  if (total === 0) return <p className="text-sm text-muted">No orders yet.</p>;
  const r = 15.915;
  let acc = 0;
  const rendered = slices.map((s) => {
    const pct = (s.count / total) * 100;
    const offset = 25 - acc;
    acc += pct;
    return { ...s, pct, offset, color: DONUT_COLORS[s.label] ?? "#64748b" };
  });
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 42 42" className="h-32 w-32 shrink-0" role="img" aria-label="Order status breakdown">
        <circle cx="21" cy="21" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        {rendered.map((s) => (
          <circle
            key={s.label}
            cx="21"
            cy="21"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="6"
            strokeDasharray={`${Math.max(0, s.pct - 0.5)} 100`}
            strokeDashoffset={s.offset}
          />
        ))}
        <text x="21" y="20" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1a2b1e">
          {total}
        </text>
        <text x="21" y="25" textAnchor="middle" fontSize="3.5" fill="#5c6b60">
          orders
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {rendered.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="capitalize">{s.label.split("_").join(" ").toLowerCase()}</span>
            <span className="text-muted">
              {s.count} · {Math.round(s.pct)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
