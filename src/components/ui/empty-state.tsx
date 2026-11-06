export function EmptyState({
  title,
  body,
  action,
  icon = "🛒",
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white px-6 py-12 text-center shadow-xs">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2f7fc] text-3xl mb-3.5">
        {icon}
      </div>
      <h3 className="font-black text-[#1c1c1c] text-base sm:text-lg">{title}</h3>
      {body ? <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
