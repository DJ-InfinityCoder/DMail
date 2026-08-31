export default function MailboxesSettingsLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-7 w-32 rounded skeleton-shimmer" />
            <div className="h-3.5 w-52 rounded skeleton-shimmer" />
          </div>
          <div className="flex-1" />
          <div className="h-9 w-36 rounded-lg skeleton-shimmer" />
        </div>
        {/* Mailbox rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl px-6 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 rounded skeleton-shimmer" style={{ width: `${45 + i * 10}%` }} />
              <div className="h-3 w-28 rounded skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full skeleton-shimmer" />
              <div className="h-5 w-20 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
