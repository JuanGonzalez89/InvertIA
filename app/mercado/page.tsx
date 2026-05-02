import { ArrowDownRight, ArrowUpRight, LineChart, Activity } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { MarketStocks } from "@/components/dashboard/market-stocks"
import { Sparkline } from "@/components/dashboard/sparkline"
import { getBCBAMarketStatus } from "@/lib/market/market-status"

export const dynamic = "force-dynamic"

const INDICES = [
  {
    name: "S&P 500",
    value: "5.842,30",
    delta: "+0,72%",
    positive: true,
    spark: [5800, 5810, 5815, 5820, 5825, 5830, 5838, 5842],
  },
  {
    name: "NASDAQ",
    value: "18.920,15",
    delta: "+1,15%",
    positive: true,
    spark: [18700, 18750, 18780, 18800, 18840, 18870, 18900, 18920],
  },
  {
    name: "MERVAL",
    value: "1.985.420",
    delta: "+2,40%",
    positive: true,
    spark: [1940000, 1950000, 1955000, 1960000, 1965000, 1975000, 1980000, 1985420],
  },
  {
    name: "Dow Jones",
    value: "42.180,90",
    delta: "-0,18%",
    positive: false,
    spark: [42250, 42230, 42210, 42200, 42190, 42185, 42180, 42180.9],
  },
]

const SECTORS = [
  { name: "Tecnología", delta: "+2,1%", positive: true },
  { name: "Energía", delta: "+1,8%", positive: true },
  { name: "Financieras", delta: "+0,9%", positive: true },
  { name: "Consumo", delta: "-0,3%", positive: false },
  { name: "Salud", delta: "+0,4%", positive: true },
  { name: "Industriales", delta: "-0,8%", positive: false },
]

export default function MercadoPage() {
  const marketStatus = getBCBAMarketStatus()

  return (
    <>
      <PageHeader
        icon={LineChart}
        eyebrow="Mercado"
        title="Mercado en vivo"
        description="Índices globales, sectores y acciones destacadas con cotizaciones en tiempo real."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {marketStatus.label}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${marketStatus.isOpen ? "bg-primary terminal-pulse" : "bg-muted-foreground/60"}`}
              aria-hidden
            />
          </div>
        }
      />

      {/* Indices */}
      <section aria-labelledby="indices-title">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="indices-title"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Índices globales
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INDICES.map((idx) => (
            <article
              key={idx.name}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {idx.name}
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
                    {idx.value}
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                    idx.positive
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {idx.positive ? (
                    <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5" aria-hidden />
                  )}
                  {idx.delta}
                </span>
              </div>
              <div className="mt-3 h-10">
                <Sparkline data={idx.spark} positive={idx.positive} className="h-full w-full" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <MarketStocks />

      {/* Sectors */}
      <section
        aria-labelledby="sectors-title"
        className="rounded-xl border border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="sectors-title" className="text-sm font-semibold text-foreground">
            Sectores del día
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            Variación intradía
          </span>
        </div>
        <ul className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 lg:grid-cols-6">
          {SECTORS.map((s) => (
            <li
              key={s.name}
              className="flex items-center justify-between bg-card px-4 py-3"
            >
              <span className="text-sm text-foreground">{s.name}</span>
              <span
                className={`font-mono text-xs tabular-nums ${
                  s.positive ? "text-primary" : "text-destructive"
                }`}
              >
                {s.delta}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
