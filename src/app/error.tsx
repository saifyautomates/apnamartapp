"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If the problem continues, contact the store.</p>
      <button onClick={reset} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
