function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-neutral-100 ${className}`} />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-neutral-100 bg-white p-3 shadow-xs">
          <Block className="h-32 w-full rounded-xl" />
          <Block className="mt-3 h-4 w-3/4" />
          <Block className="mt-2 h-3 w-1/2" />
          <div className="mt-4 flex items-center justify-between">
            <Block className="h-5 w-16" />
            <Block className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2" aria-label="Loading product">
      <Block className="h-80 w-full rounded-2xl" />
      <div className="space-y-4">
        <Block className="h-8 w-3/4" />
        <Block className="h-4 w-1/3" />
        <Block className="h-10 w-44" />
        <Block className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div aria-label="Loading cart" className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-neutral-100 bg-white p-3 shadow-xs">
          <Block className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Block className="h-4 w-2/3" />
            <Block className="h-3 w-1/3" />
            <Block className="h-4 w-20" />
          </div>
        </div>
      ))}
      <Block className="h-36 w-full rounded-2xl" />
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading orders">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-neutral-100 bg-white p-4 shadow-xs">
          <Block className="h-5 w-1/3" />
          <Block className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div aria-label="Loading category" className="space-y-4">
      <Block className="h-8 w-48" />
      <Block className="h-4 w-72" />
      <div className="mt-4">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
