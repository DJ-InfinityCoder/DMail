export default function DomainsSettingsLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-7 w-28 rounded skeleton-shimmer" />
            <div className="h-3.5 w-52 rounded skeleton-shimmer" />
          </div>
          <div className="flex-1" />
          <div className="h-9 w-32 rounded-lg skeleton-shimmer" />
        </div>
        {/* Domain cards */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg skeleton-shimmer" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 rounded skeleton-shimmer" />
                  <div className="h-3 w-24 rounded skeleton-shimmer" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
