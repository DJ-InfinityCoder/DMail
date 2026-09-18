export default function EmailDetailLoading() {
  return (
    <div className="flex flex-col h-full bg-background border-l border-border/20 overflow-hidden animate-fade-in">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary/60 skeleton-shimmer" />
          <div className="w-48 h-4 rounded bg-secondary/60 skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-secondary/60 skeleton-shimmer" />
          <div className="w-7 h-7 rounded-md bg-secondary/60 skeleton-shimmer" />
        </div>
      </div>

      {/* Message content skeleton */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Subject */}
        <div className="space-y-2">
          <div className="w-3/4 h-6 rounded-md bg-secondary/70 skeleton-shimmer" />
        </div>

        {/* Sender line */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-secondary/70 skeleton-shimmer flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="w-36 h-4 rounded bg-secondary/70 skeleton-shimmer" />
            <div className="w-24 h-3 rounded bg-secondary/50 skeleton-shimmer" />
          </div>
          <div className="w-16 h-3 rounded bg-secondary/50 skeleton-shimmer" />
        </div>

        {/* Email body shimmer lines */}
        <div className="space-y-3 pt-4 pl-0 sm:pl-[52px]">
          <div className="w-full h-4 rounded bg-secondary/60 skeleton-shimmer" />
          <div className="w-11/12 h-4 rounded bg-secondary/60 skeleton-shimmer" />
          <div className="w-4/5 h-4 rounded bg-secondary/60 skeleton-shimmer" />
          <div className="w-2/3 h-4 rounded bg-secondary/50 skeleton-shimmer" />
          <div className="h-4" />
          <div className="w-full h-4 rounded bg-secondary/60 skeleton-shimmer" />
          <div className="w-5/6 h-4 rounded bg-secondary/60 skeleton-shimmer" />
          <div className="w-3/4 h-4 rounded bg-secondary/50 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
