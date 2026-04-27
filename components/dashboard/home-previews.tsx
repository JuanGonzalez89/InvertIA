import Link from "next/link"
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

const TOP_HOLDINGS = [
  {
    ticker: "YPF",
    name: "YPF S.A.",
    total: "$ 1.525.000",
    delta: "+2,8%",
    positive: true,
    spark: [28, 28.4, 28.9, 29.3, 29.8, 29.5, 30.0, 30.2, 30.4, 30.5],
  },
  {
    ticker: "TX26",
    name: "Bono Tesoro 2026",
    total: "$ 1.494.000",
    delta: "+0,2%",
    positive: true,
    spark: [1240, 1241, 1242, 1244, 1243, 1244, 1245, 1244, 1245, 1245],
  },
  {
    ticker: "VIST",
    name: "Vista Energy",
    total: "$ 1.320.000",
    delta: "-1,3%",
    positive: false,
    spark: [55, 54.5, 54, 53.5, 53.8, 53.2, 52.9, 53, 52.6, 52.8],
  },
]

const TOP_MOVERS = [
  { ticker: "NVDA", name: "NVIDIA", price: "US$ 142,30", delta: "+4,8%", positive: true },
  { ticker: "GGAL", name: "Galicia", price: "US$ 58,20", delta: "+3,2%", positive: true },
  { ticker: "AMD", name: "AMD", price: "US$ 162,40", delta: "+2,8%", positive: true },
  { ticker: "TSLA", name: "Tesla", price: "US$ 248,60", delta: "-1,8%", positive: false },
]

const LATEST_MOVES = [
  { type: "compra", ticker: "NVDA", total: "$ 77.000", date: "24/04" },
  { type: "venta", ticker: "VIST", total: "$ 264.000", date: "23/04" },
  { type: "compra", ticker: "YPF", total: "$ 305.000", date: "22/04" },
] as const

export function HomePreviews() {
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
            {TOP_HOLDINGS.map((h) => (
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
            {TOP_MOVERS.map((s) => (
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
        <LiquidityCard />

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
            {LATEST_MOVES.map((m, i) => (
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
