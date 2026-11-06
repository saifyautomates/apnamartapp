"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-20 w-20 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center text-4xl mb-4 shadow-sm border border-red-100">
        ⚠️
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#1c1c1c] tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
        {error?.message || "An unexpected error occurred while loading this page. Don't worry, your cart is safe."}
      </p>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={reset}
          className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-md transition active:scale-95 cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-6 py-2.5 text-xs sm:text-sm font-bold text-neutral-700 transition cursor-pointer"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
