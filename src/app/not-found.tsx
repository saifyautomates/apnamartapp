import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-20 w-20 rounded-3xl bg-[#f2f7fc] text-[#0c831f] flex items-center justify-center text-4xl mb-4 shadow-sm border border-neutral-100">
        🔍
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
        The page you are looking for might have been moved or does not exist. Browse our fresh grocery aisles instead!
      </p>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-md transition active:scale-95 cursor-pointer"
        >
          Explore Groceries →
        </Link>
        <Link
          href="/category"
          className="rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-6 py-2.5 text-xs sm:text-sm font-bold text-neutral-700 transition cursor-pointer"
        >
          View Categories
        </Link>
      </div>
    </div>
  );
}
