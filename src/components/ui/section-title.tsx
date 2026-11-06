import Link from "next/link";

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
    <div className="mb-3.5 flex items-baseline justify-between px-1">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1c1c1c] flex items-center gap-2">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm font-medium">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="text-sm sm:text-base font-bold text-[#0c831f] hover:underline cursor-pointer"
        >
          {actionText}
        </Link>
      ) : null}
    </div>
  );
}
