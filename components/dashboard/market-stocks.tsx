import { ArrowDownRight, ArrowUpRight, LineChart } from "lucide-react"
import { Sparkline } from "./sparkline"
import { getMarketQuotes } from "@/lib/services/market.service"

interface MarketStock {
  ticker: string
  name: string
  price: string
  delta: string
  positive: boolean
  spark: number[]
}

function buildSparkline(price: number, changePercent: number) {
  const previous = changePercent === -100 ? price : price / (1 + changePercent / 100)

  return Array.from({ length: 8 }, (_, index) => {
    const progress = index / 7
    return previous + (price - previous) * progress
  })
}

export async function MarketStocks({ query }: { query?: string } = {}) {
  const quotes = await getMarketQuotes()

  const stocks: MarketStock[] =
    quotes.length > 0
      ? quotes.map((quote) => ({
          ticker: quote.ticker,
          name: quote.name,
          price: `${quote.currency} ${quote.price.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          delta: `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`,
          positive: quote.changePercent >= 0,
          spark: buildSparkline(quote.price, quote.changePercent),
        }))
      : []

  const filteredStocks = query?.trim()
    ? stocks.filter((stock) => {
        const needle = query.trim().toLowerCase()
        return [stock.ticker, stock.name].some((value) => value.toLowerCase().includes(needle))
      })
    : stocks

  return (
    <section
      id="mercado"
      aria-labelledby="market-title"
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="market-title" className="text-sm font-semibold text-foreground">
            Acciones destacadas
          </h2>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          Tiempo real · NYSE/NASDAQ
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 lg:grid-cols-4">
        {filteredStocks.length === 0 ? (
          <div className="col-span-full px-5 py-10 text-sm text-muted-foreground">
            No encontramos activos para esta búsqueda.
          </div>
        ) : filteredStocks.map((s) => (
          <article
            key={s.ticker}
            className="group flex flex-col gap-2 bg-card p-4 transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold text-foreground">
                  {s.ticker}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {s.name}
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                  s.positive
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {s.positive ? (
                  <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5" aria-hidden />
                )}
                {s.delta}
              </span>
            </div>

            <div className="font-mono text-base font-semibold tabular-nums tracking-tight text-foreground">
              {s.price}
            </div>

            <div className="h-8 -mx-1">
              <Sparkline
                data={s.spark}
                positive={s.positive}
                className="h-full w-full"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
