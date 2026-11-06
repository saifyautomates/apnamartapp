export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-72 rounded-2xl bg-neutral-200" />
          <div className="mt-2 h-4 w-96 rounded-xl bg-neutral-200" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-52 rounded-2xl bg-neutral-200" />
          <div className="h-10 w-36 rounded-2xl bg-neutral-200" />
        </div>
      </div>

      {/* 5 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-3xl bg-gradient-to-br from-neutral-200 to-neutral-300 p-5 flex flex-col justify-between shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div className="h-10 w-10 rounded-2xl bg-white/40" />
              <div className="h-4 w-20 rounded-md bg-white/40" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-32 rounded-xl bg-white/50" />
              <div className="h-3 w-24 rounded bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Metrics Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border border-neutral-200 bg-white p-3.5 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-neutral-100 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 rounded bg-neutral-200" />
              <div className="h-5 w-24 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="h-72 rounded-3xl border border-neutral-200 bg-white p-5" />
          <div className="h-72 rounded-3xl border border-neutral-200 bg-white p-5" />
        </div>
        <div className="h-72 rounded-3xl border border-neutral-200 bg-white p-5" />
      </div>

      {/* Tables & Feed Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="h-80 rounded-3xl border border-neutral-200 bg-white p-5" />
        <div className="h-80 rounded-3xl border border-neutral-200 bg-white p-5" />
        <div className="h-80 rounded-3xl border border-neutral-200 bg-white p-5" />
      </div>
    </div>
  );
}

