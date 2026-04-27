import { TrendingUp, Loader2, Check } from "lucide-react"

export interface ToolCallPriceProps {
  ticker: string
  price: string
  /** When true → spinner; otherwise → check (completed) */
  loading?: boolean
}

/**
 * Tool Call: market price lookup.
 * Visual representation of `getPrice(ticker)` execution.
 */
export function ToolCallPrice({ ticker, price, loading = false }: ToolCallPriceProps) {
  return (
    <div className="rounded-lg border border-border bg-card/80 backdrop-blur p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              tool · get_market_price
            </span>
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" aria-hidden />
            ) : (
              <Check className="h-3 w-3 text-primary" aria-hidden />
            )}
          </div>
          <p className="mt-1 font-mono text-sm text-foreground">
            Consultando API de mercado:{" "}
            <span className="font-semibold text-primary">{ticker}</span>{" "}
            <span className="text-muted-foreground">=</span>{" "}
            <span className="tabular-nums">{price}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
