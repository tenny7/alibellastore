export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-40 bg-gray-200 rounded mb-6 animate-pulse" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar skeleton (desktop) */}
        <aside className="hidden lg:block w-[260px] shrink-0 animate-pulse">
          <div className="space-y-4">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4" />
            ))}
            <div className="h-5 w-20 bg-gray-200 rounded mt-6" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Title + sort skeleton */}
          <div className="flex items-center justify-between mb-6 animate-pulse">
            <div>
              <div className="h-7 w-36 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded mt-2" />
            </div>
            <div className="h-9 w-32 bg-gray-200 rounded" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-square bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
