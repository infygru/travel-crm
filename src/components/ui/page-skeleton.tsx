/**
 * Generic page skeleton loader — used as fallback in loading.tsx files
 * Renders a content-shape shimmer that fits most list/detail pages
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 bg-gray-200 rounded-lg w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-72" />
        </div>
        <div className="h-9 bg-gray-200 rounded-xl w-32" />
      </div>

      {/* Filters / tabs row */}
      <div className="flex items-center gap-3">
        <div className="h-9 bg-gray-100 rounded-xl w-52" />
        <div className="h-9 bg-gray-100 rounded-xl w-28" />
        <div className="h-9 bg-gray-100 rounded-xl w-28" />
        <div className="ml-auto h-9 bg-gray-100 rounded-xl w-36" />
      </div>

      {/* Table / card list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="h-3.5 bg-gray-200 rounded w-40" />
          <div className="h-3.5 bg-gray-200 rounded w-24 ml-auto" />
          <div className="h-3.5 bg-gray-200 rounded w-24" />
          <div className="h-3.5 bg-gray-200 rounded w-20" />
          <div className="h-3.5 bg-gray-200 rounded w-16" />
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 bg-gray-100 rounded-full shrink-0" />
              <div>
                <div className="h-4 bg-gray-200 rounded w-36 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-52" />
              </div>
            </div>
            <div className="h-5 bg-gray-100 rounded-full w-20" />
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-20" />
            <div className="h-7 bg-gray-100 rounded-lg w-16" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-100 rounded w-36" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-100 rounded-lg w-20" />
          <div className="h-8 bg-gray-100 rounded-lg w-20" />
        </div>
      </div>
    </div>
  )
}
