export default function ContactsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-40" />
        </div>
        <div className="h-9 bg-gray-200 rounded-lg w-32" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="h-9 bg-gray-100 rounded-lg flex-1" />
          <div className="h-9 bg-gray-100 rounded-lg w-32" />
          <div className="h-9 bg-gray-100 rounded-lg w-32" />
          <div className="h-9 bg-gray-100 rounded-lg w-24" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 flex gap-8">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-20" />
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full" />
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-44" />
                </div>
              </div>
              <div className="h-5 bg-gray-100 rounded-full w-20 ml-8" />
              <div className="h-4 bg-gray-100 rounded w-12" />
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
