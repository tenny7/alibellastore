export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-64 bg-surface-fg/15 rounded mb-6 animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image skeleton */}
        <div className="animate-pulse">
          <div className="aspect-square bg-surface-fg/15 rounded-xl" />
        </div>

        {/* Details skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-24 bg-surface-fg/15 rounded" />
          <div className="h-8 w-3/4 bg-surface-fg/15 rounded" />
          <div className="h-7 w-32 bg-surface-fg/15 rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-surface-fg/15 rounded w-full" />
            <div className="h-4 bg-surface-fg/15 rounded w-5/6" />
            <div className="h-4 bg-surface-fg/15 rounded w-2/3" />
          </div>
          <div className="h-12 bg-surface-fg/15 rounded-lg w-full mt-6" />
        </div>
      </div>
    </div>
  );
}
