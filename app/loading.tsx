export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="mt-3 h-4 w-72 rounded bg-muted/80" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-24 rounded bg-muted/80" />
            <div className="mt-4 h-8 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-48 rounded bg-muted/80" />
        <div className="mt-4 h-36 rounded bg-muted/60" />
      </div>
    </div>
  )
}