import Link from "next/link"
import type { Asset, Order } from "@/lib/types/portfolio"
import type { MarketQuoteSnapshot } from "@/lib/services/market.service"
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Briefcase,
  LineChart,
  Receipt,
} from "lucide-react"
import { Sparkline } from "./sparkline"
import { LiquidityCard } from "./liquidity-card"

// When portfolio data is not provided, show a lightweight empty state
const FALLBACK_TOP_MOVERS = [
  { ticker: "NVDA", name: "NVIDIA", price: "US$ 142,30", delta: "+4,8%", positive: true },
  { ticker: "GGAL", name: "Galicia", price: "US$ 58,20", delta: "+3,2%", positive: true },
  { ticker: "AMD", name: "AMD", price: "US$ 162,40", delta: "+2,8%", positive: true },
  { ticker: "TSLA", name: "Tesla", price: "US$ 248,60", delta: "-1,8%", positive: false },
]

const FALLBACK_LATEST_MOVES = [
  { type: "compra", ticker: "NVDA", total: "$ 77.000", date: "24/04" },
  { type: "venta", ticker: "VIST", total: "$ 264.000", date: "23/04" },
  { type: "compra", ticker: "YPF", total: "$ 305.000", date: "22/04" },
] as const

interface HomePreviewsProps {
  topHoldings?: Asset[]
  topMovers?: MarketQuoteSnapshot[]
  latestOrders?: Order[]
  liquidityARS?: number
  totalCurrentValue?: number
}

function buildSparkline(price: number, changePercent: number) {
  const previous = changePercent === -100 ? price : price / (1 + changePercent / 100)

  return Array.from({ length: 10 }, (_, index) => {
    const progress = index / 9
    return previous + (price - previous) * progress
  })
}

export function HomePreviews({
  topHoldings = [],
  topMovers = [],
  latestOrders = [],
  liquidityARS,
  totalCurrentValue,
}: HomePreviewsProps) {
  const holdings =
    topHoldings.length > 0
      ? [...topHoldings]
          .sort((a, b) => b.quantity * (b.currentPrice || 0) - a.quantity * (a.currentPrice || 0))
          .slice(0, 3)
          .map((asset) => {
            const total = asset.quantity * (asset.currentPrice || asset.avgBuyPrice || 0)
            const delta = asset.dailyChangePercent ?? 0
            return {
              ticker: asset.ticker,
              name: asset.name,
              total: `$ ${total.toLocaleString("es-AR")}`,
              delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`,
              positive: delta >= 0,
              spark: buildSparkline(asset.currentPrice || asset.avgBuyPrice || 0, delta),
            }
          })
      : []

  const movers =
    topMovers.length > 0
      ? topMovers.map((quote) => ({
          ticker: quote.ticker,
          name: quote.name,
          price: `${quote.currency} ${quote.price.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          delta: `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`,
          positive: quote.changePercent >= 0,
        }))
      : FALLBACK_TOP_MOVERS

  const latestMoves =
    latestOrders.length > 0
      ? latestOrders.map((order) => ({
          type: order.type === "BUY" ? "compra" : "venta",
          ticker: order.ticker,
          total: `$ ${order.totalAmount.toLocaleString("es-AR")}`,
          date: order.createdAt.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
          }),
        }))
      : []

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main column */}
      <div className="space-y-6 lg:col-span-2">
        {/* Cartera preview */}
        <section
          aria-labelledby="home-portfolio"
          className="rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" aria-hidden />
              <h2 id="home-portfolio" className="text-sm font-semibold text-foreground">
                Tus principales activos
              </h2>
            </div>
            <Link
              href="/cartera"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
            >
              Ver cartera
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {holdings.map((h) => (
              <li
                key={h.ticker}
                className="grid grid-cols-[1.4fr_1fr_0.8fr] items-center gap-3 px-5 py-3"
              >
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
                <div className="h-10 w-full">
                  <Sparkline data={h.spark} positive={h.positive} className="h-full w-full" />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Mercado preview */}
        <section
          aria-labelledby="home-market"
          className="rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" aria-hidden />
              <h2 id="home-market" className="text-sm font-semibold text-foreground">
                Top movers del mercado
              </h2>
            </div>
            <Link
              href="/mercado"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
            >
              Ver mercado
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
            {movers.map((s) => (
              <article
                key={s.ticker}
                className="flex flex-col gap-1.5 bg-card p-4"
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
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6" aria-label="Liquidez, movimientos y chat">
        <LiquidityCard
          liquidityARS={liquidityARS}
          totalCurrentValue={totalCurrentValue}
        />

        {/* Movimientos preview */}
        <section
          aria-labelledby="home-moves"
          className="rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" aria-hidden />
              <h2 id="home-moves" className="text-sm font-semibold text-foreground">
                Últimos movimientos
              </h2>
            </div>
            <Link
              href="/movimientos"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
            >
              Historial
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {latestMoves.map((m, i) => (
              <li
                key={`${m.ticker}-${i}`}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      m.type === "compra"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/15 text-destructive"
                    }`}
                    aria-hidden
                  >
                    {m.type === "compra" ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground capitalize">
                        {m.type}
                      </span>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {m.ticker}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {m.date}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {m.total}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Chat CTA */}
        <Link
          href="/chat"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] to-card p-5 transition-colors hover:border-primary/60"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                AI Portfolio Manager
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Asistente financiero
              </div>
            </div>
          </div>
          <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
            Pedí análisis, contexto de mercado o ejecución de operaciones en lenguaje natural.
          </p>
          <div className="inline-flex items-center gap-1 font-mono text-[11px] text-primary">
            Abrir chat
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl"
          />
        </Link>
      </aside>
    </div>
  )
}
