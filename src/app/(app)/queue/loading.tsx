/**
 * Queue loading state — shown while server populates + fetches the queue.
 */

export default function QueueLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-hover" />
        <div className="mt-4 h-9 w-64 animate-pulse rounded bg-surface-hover" />
      </div>

      {/* Spotlight skeleton */}
      <div className="mb-10 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 animate-pulse rounded bg-surface-hover" />
          <div className="h-3 w-12 animate-pulse rounded bg-surface-hover" />
        </div>
        <div className="mt-4 h-7 w-4/5 animate-pulse rounded bg-surface-hover" />
        <div className="mt-2 h-7 w-3/5 animate-pulse rounded bg-surface-hover" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-surface-hover" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-hover" />
        <div className="mt-6 flex gap-2">
          <div className="h-10 w-20 animate-pulse rounded-lg bg-surface-hover" />
          <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-hover" />
          <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-hover" />
        </div>
      </div>

      {/* Compact card skeletons */}
      <div className="mb-5 h-px bg-border" />
      <div className="mb-5 h-3 w-16 animate-pulse rounded bg-surface-hover" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface px-5 py-4"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <div className="h-5 w-3/4 animate-pulse rounded bg-surface-hover" />
            <div className="mt-2 flex gap-2">
              <div className="h-3 w-20 animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-12 animate-pulse rounded bg-surface-hover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
