export default function EmailDetailLoading() {
  return (
    <div className="flex-1 flex overflow-hidden w-full h-full min-w-0">
      {/* Left pane skeleton */}
      <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-border/20 bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 gap-2">
          <div className="h-5 w-24 rounded skeleton-shimmer" />
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg skeleton-shimmer" />
            <div className="h-7 w-7 rounded-lg skeleton-shimmer" />
          </div>
        </div>
        <div className="px-3 py-2 border-b border-border/20">
          <div className="h-8 w-full rounded-lg skeleton-shimmer" />
        </div>
        <div className="divide-y divide-border/30 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex items-start gap-3.5 px-4 py-3.5 ${i === 0 ? "bg-primary/10 border-l-4 border-l-primary" : ""}`}>
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
      {/* Right pane - email thread skeleton */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Email header */}
        <div className="px-6 py-4 border-b border-border/20 space-y-3">
          <div className="h-6 w-3/4 rounded skeleton-shimmer" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full skeleton-shimmer" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-40 rounded skeleton-shimmer" />
              <div className="h-3 w-56 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
        {/* Email body */}
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3.5 rounded skeleton-shimmer" style={{ width: `${70 + (i % 4) * 8}%` }} />
          ))}
          <div className="h-3.5 w-1/3 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
