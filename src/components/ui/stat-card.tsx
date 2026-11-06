export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#1c1c1c]">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-[#0c831f] font-bold">{sub}</p> : null}
    </div>
  );
}
