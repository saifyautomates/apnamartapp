function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-line ${className}`} />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-line bg-white p-3">
          <Block className="h-32 w-full" />
          <Block className="mt-2 h-4 w-3/4" />
          <Block className="mt-2 h-3 w-1/2" />
          <Block className="mt-3 h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-label="Loading product">
      <Block className="h-72 w-full" />
      <div>
        <Block className="h-8 w-2/3" />
        <Block className="mt-3 h-4 w-1/2" />
        <Block className="mt-4 h-10 w-40" />
        <Block className="mt-4 h-10 w-48" />
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div aria-label="Loading cart">
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-3 flex gap-3 rounded-lg border border-line bg-white p-3">
          <Block className="h-20 w-20 shrink-0" />
          <div className="flex-1">
            <Block className="h-4 w-2/3" />
            <Block className="mt-2 h-3 w-1/3" />
            <Block className="mt-3 h-8 w-32" />
          </div>
        </div>
      ))}
      <Block className="h-32 w-full" />
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading orders">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-line bg-white p-4">
          <Block className="h-5 w-1/3" />
          <Block className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div aria-label="Loading category">
      <Block className="h-8 w-48" />
      <Block className="mt-2 h-4 w-72" />
      <div className="mt-4">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
