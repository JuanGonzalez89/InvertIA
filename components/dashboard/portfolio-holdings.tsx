import { ArrowDownRight, ArrowUpRight, Briefcase } from "lucide-react"
import { Sparkline } from "./sparkline"

interface Holding {
  ticker: string
  name: string
  type: "Acción" | "CEDEAR" | "Bono" | "ETF"
  qty: number
  price: string
  total: string
  delta: string
  positive: boolean
  spark: number[]
}

const HOLDINGS: Holding[] = [
  {
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    type: "CEDEAR",
    qty: 12,
    price: "$ 38.500",
    total: "$ 462.000",
    delta: "+4,8%",
    positive: true,
    spark: [30, 32, 31, 33, 35, 34, 36, 37, 38, 38.5],
  },
  {
    ticker: "VIST",
    name: "Vista Energy",
    type: "Acción",
    qty: 25,
    price: "$ 52.800",
    total: "$ 1.320.000",
    delta: "-1,3%",
    positive: false,
    spark: [55, 54.5, 54, 53.5, 53.8, 53.2, 52.9, 53, 52.6, 52.8],
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    type: "CEDEAR",
    qty: 8,
    price: "$ 31.150",
    total: "$ 249.200",
    delta: "+2,1%",
    positive: true,
    spark: [29, 29.5, 30, 29.8, 30.2, 30.5, 30.7, 30.9, 31.0, 31.15],
  },
  {
    ticker: "YPF",
    name: "YPF S.A.",
    type: "Acción",
    qty: 50,
    price: "$ 30.500",
    total: "$ 1.525.000",
    delta: "+2,8%",
    positive: true,
    spark: [28, 28.4, 28.9, 29.3, 29.8, 29.5, 30.0, 30.2, 30.4, 30.5],
  },
  {
    ticker: "TX26",
    name: "Bono Tesoro 2026",
    type: "Bono",
    qty: 1200,
    price: "$ 1.245",
    total: "$ 1.494.000",
    delta: "+0,2%",
    positive: true,
    spark: [1240, 1241, 1242, 1244, 1243, 1244, 1245, 1244, 1245, 1245],
  },
  {
    ticker: "URA",
    name: "Uranium ETF",
    type: "ETF",
    qty: 40,
    price: "$ 31.150",
    total: "$ 1.246.000",
    delta: "-0,6%",
    positive: false,
    spark: [32, 31.8, 31.6, 31.5, 31.4, 31.3, 31.2, 31.1, 31.15, 31.15],
  },
]

const TYPE_COLORS: Record<Holding["type"], string> = {
  Acción: "bg-primary/10 text-primary",
  CEDEAR: "bg-chart-3/15 text-chart-3",
  Bono: "bg-chart-4/15 text-chart-4",
  ETF: "bg-secondary text-foreground",
}

export function PortfolioHoldings() {
  return (
    <section
      id="cartera"
      aria-labelledby="portfolio-title"
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="portfolio-title" className="text-sm font-semibold text-foreground">
            Mi cartera
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {HOLDINGS.length} activos
          </span>
        </div>
        <a
          href="#"
          className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          Ver todo →
        </a>
      </div>

      {/* Table header */}
      <div className="hidden md:grid md:grid-cols-[1.6fr_0.7fr_0.6fr_1fr_1fr_0.8fr] gap-3 px-5 py-2 border-b border-border">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Activo
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Tipo
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
          Cant.
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
          Precio
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
          Valor / Var.
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
          7d
        </div>
      </div>

      <ul className="divide-y divide-border">
        {HOLDINGS.map((h) => (
          <li
            key={h.ticker}
            className="grid grid-cols-[1.6fr_1fr_0.8fr] md:grid-cols-[1.6fr_0.7fr_0.6fr_1fr_1fr_0.8fr] items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40"
          >
            {/* Asset */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-[10px] font-semibold text-foreground">
                {h.ticker.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold leading-tight text-foreground">
                  {h.ticker}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {h.name}
                </div>
              </div>
            </div>

            {/* Type */}
            <div className="hidden md:block">
              <span
                className={`inline-flex rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${TYPE_COLORS[h.type]}`}
              >
                {h.type}
              </span>
            </div>

            {/* Qty */}
            <div className="hidden md:block text-right font-mono text-sm tabular-nums text-foreground">
              {h.qty}
            </div>

            {/* Price */}
            <div className="hidden md:block text-right font-mono text-sm tabular-nums text-foreground">
              {h.price}
            </div>

            {/* Value / delta */}
            <div className="text-right">
              <div className="font-mono text-sm font-medium tabular-nums text-foreground">
                {h.total}
              </div>
              <div
                className={`inline-flex items-center justify-end gap-0.5 font-mono text-[11px] tabular-nums ${
                  h.positive ? "text-primary" : "text-destructive"
                }`}
              >
                {h.positive ? (
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-3 w-3" aria-hidden />
                )}
                {h.delta}
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-10 w-full">
              <Sparkline data={h.spark} positive={h.positive} className="h-full w-full" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
