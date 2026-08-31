export default function SettingsLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Title */}
        <div className="space-y-2 mb-8">
          <div className="h-8 w-40 rounded skeleton-shimmer" />
          <div className="h-4 w-72 rounded skeleton-shimmer" />
        </div>
        {/* Org card skeleton */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded skeleton-shimmer" />
              <div className="h-3 w-48 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="h-3.5 w-52 rounded skeleton-shimmer" />
          </div>
        </div>
        {/* Appearance card */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="h-4 w-32 rounded skeleton-shimmer" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 w-24 rounded-lg skeleton-shimmer" />
            ))}
          </div>
        </div>
        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-6 space-y-2">
            <div className="h-5 w-24 rounded skeleton-shimmer" />
            <div className="h-4 w-40 rounded skeleton-shimmer" />
          </div>
          <div className="glass rounded-xl p-6 space-y-2">
            <div className="h-5 w-24 rounded skeleton-shimmer" />
            <div className="h-4 w-40 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
