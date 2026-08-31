export default function FolderLoading() {
  return (
    <div className="flex-1 flex overflow-hidden w-full h-full min-w-0">
      {/* Left pane skeleton */}
      <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-border/20 bg-card">
        {/* Toolbar skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 gap-2">
          <div className="h-5 w-24 rounded skeleton-shimmer" />
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg skeleton-shimmer" />
            <div className="h-7 w-7 rounded-lg skeleton-shimmer" />
          </div>
        </div>
        {/* Search bar skeleton */}
        <div className="px-3 py-2 border-b border-border/20">
          <div className="h-8 w-full rounded-lg skeleton-shimmer" />
        </div>
        {/* Email rows skeleton */}
        <div className="divide-y divide-border/30 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5 px-4 py-3.5">
              <div className="w-4 h-4 rounded skeleton-shimmer mt-1 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-3.5 rounded skeleton-shimmer" style={{ width: `${55 + (i % 3) * 20}%` }} />
                  <div className="w-12 h-3 rounded skeleton-shimmer" />
                </div>
                <div className="h-3 rounded skeleton-shimmer" style={{ width: `${65 + (i % 4) * 8}%` }} />
                <div className="h-2.5 rounded skeleton-shimmer" style={{ width: `${40 + (i % 5) * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Right pane placeholder */}
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center space-y-3 opacity-30">
          <div className="w-16 h-16 rounded-2xl skeleton-shimmer mx-auto" />
          <div className="w-40 h-4 rounded skeleton-shimmer mx-auto" />
          <div className="w-56 h-3 rounded skeleton-shimmer mx-auto" />
        </div>
      </div>
    </div>
  );
}
