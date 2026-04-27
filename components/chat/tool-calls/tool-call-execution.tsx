import { CheckCircle2, ArrowDownLeft, ArrowUpRight } from "lucide-react"

export interface ToolCallExecutionProps {
  cashDelta: string
  cashLabel?: string
  positionDelta: string
  positionLabel?: string
  /** e.g. "Orden Ejecutada" */
  status?: string
  timestamp?: string
}

/**
 * Tool Call: order execution ticket — green confirmation card.
 * Visual representation of `executeOrder(...)` completion.
 */
export function ToolCallExecution({
  cashDelta,
  cashLabel = "Liquidez",
  positionDelta,
  positionLabel = "Cartera",
  status = "Orden Ejecutada",
  timestamp = "12:42:18",
}: ToolCallExecutionProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/40 bg-primary/[0.06] p-4">
      {/* corner glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />

      <div className="relative flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
        <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
          {status}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground tabular-nums">
          {timestamp}
        </span>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border/60 bg-background/40 p-2.5">
          <div className="flex items-center gap-1.5">
            <ArrowDownLeft className="h-3 w-3 text-destructive" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {cashLabel}
            </span>
          </div>
          <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
            {cashDelta}
          </div>
        </div>
        <div className="rounded-md border border-border/60 bg-background/40 p-2.5">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="h-3 w-3 text-primary" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {positionLabel}
            </span>
          </div>
          <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
            {positionDelta}
          </div>
        </div>
      </div>
    </div>
  )
}
