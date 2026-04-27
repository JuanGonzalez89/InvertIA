import { ArrowDownRight, ArrowUpRight, LineChart } from "lucide-react"
import { Sparkline } from "./sparkline"

interface MarketStock {
  ticker: string
  name: string
  price: string
  delta: string
  positive: boolean
  spark: number[]
}

const STOCKS: MarketStock[] = [
  { ticker: "AAPL", name: "Apple", price: "US$ 232,40", delta: "+1,2%", positive: true, spark: [228, 229, 230, 229.5, 230.5, 231, 231.5, 232.4] },
  { ticker: "MSFT", name: "Microsoft", price: "US$ 418,10", delta: "+0,8%", positive: true, spark: [414, 415, 416, 415.5, 416.5, 417, 417.5, 418.1] },
  { ticker: "NVDA", name: "NVIDIA", price: "US$ 142,30", delta: "+4,8%", positive: true, spark: [135, 136, 138, 139, 140, 141, 141.5, 142.3] },
  { ticker: "GOOGL", name: "Alphabet", price: "US$ 178,90", delta: "+0,5%", positive: true, spark: [177, 177.5, 178, 177.8, 178.2, 178.5, 178.7, 178.9] },
  { ticker: "AMZN", name: "Amazon", price: "US$ 198,40", delta: "-0,3%", positive: false, spark: [200, 199.5, 199, 198.8, 199, 198.6, 198.5, 198.4] },
  { ticker: "META", name: "Meta", price: "US$ 562,10", delta: "+2,1%", positive: true, spark: [550, 552, 554, 556, 558, 560, 561, 562.1] },
  { ticker: "TSLA", name: "Tesla", price: "US$ 248,60", delta: "-1,8%", positive: false, spark: [255, 254, 253, 252, 251, 250, 249, 248.6] },
  { ticker: "MELI", name: "MercadoLibre", price: "US$ 1.890", delta: "+1,5%", positive: true, spark: [1860, 1865, 1870, 1875, 1880, 1885, 1888, 1890] },
  { ticker: "VIST", name: "Vista Energy", price: "US$ 52,80", delta: "-1,3%", positive: false, spark: [54, 53.5, 53.2, 53, 52.8, 52.5, 52.7, 52.8] },
  { ticker: "GGAL", name: "Galicia", price: "US$ 58,20", delta: "+3,2%", positive: true, spark: [56, 56.5, 57, 57.3, 57.6, 57.9, 58.1, 58.2] },
  { ticker: "JPM", name: "JPMorgan", price: "US$ 234,80", delta: "+0,6%", positive: true, spark: [232, 233, 233.5, 233.8, 234, 234.3, 234.6, 234.8] },
  { ticker: "AMD", name: "AMD", price: "US$ 162,40", delta: "+2,8%", positive: true, spark: [157, 158, 159, 160, 161, 161.5, 162, 162.4] },
]

export function MarketStocks() {
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
        {STOCKS.map((s) => (
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
