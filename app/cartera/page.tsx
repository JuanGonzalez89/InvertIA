import { Briefcase, Coins, PieChart, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { PortfolioHoldings } from "@/components/dashboard/portfolio-holdings"
import { LiquidityCard } from "@/components/dashboard/liquidity-card"
import { ImportPortfolio } from "@/components/dashboard/import-portfolio"

const ALLOCATION = [
  { label: "Acciones", value: "$ 1.525.000", pct: 54.9, color: "bg-primary" },
  { label: "Bonos", value: "$ 1.494.000", pct: 53.7, color: "bg-chart-4" },
  { label: "CEDEARs", value: "$ 711.200", pct: 25.6, color: "bg-chart-3" },
  { label: "ETFs", value: "$ 1.246.000", pct: 44.8, color: "bg-secondary" },
]

const STATS = [
  { label: "Valor cartera", value: "$ 2.780.000", icon: Briefcase },
  { label: "Total invertido", value: "$ 2.450.000", icon: Coins },
  { label: "Ganancia", value: "+ $ 330.000", icon: TrendingUp, accent: true },
  { label: "Rendimiento", value: "+13,46%", icon: PieChart, accent: true },
]

export default function CarteraPage() {
  return (
    <>
      <PageHeader
        icon={Briefcase}
        eyebrow="Mi cartera"
        title="Tu cartera de inversión"
        description="Visualizá tus activos, distribución por tipo de instrumento y rendimiento detallado."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary terminal-pulse" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              6 activos · ARS
            </span>
          </div>
        }
      />

      {/* Stats */}
      <section
        aria-label="Estadísticas de la cartera"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {STATS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
              <div
                className={`mt-3 font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${
                  s.accent ? "text-primary" : "text-foreground"
                }`}
              >
                {s.value}
              </div>
            </div>
          )
        })}
      </section>

      <ImportPortfolio />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PortfolioHoldings />
        </div>

        <aside className="space-y-6" aria-label="Distribución y liquidez">
          <LiquidityCard />

          <section
            aria-labelledby="allocation-title"
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <h2
                id="allocation-title"
                className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                Distribución por tipo
              </h2>
              <PieChart className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </div>
            <ul className="mt-4 space-y-4">
              {ALLOCATION.map((a) => (
                <li key={a.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${a.color}`} aria-hidden />
                      <span className="text-sm text-foreground">{a.label}</span>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {a.value}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${a.color}`}
                      style={{ width: `${Math.min(a.pct, 100)}%` }}
                      aria-hidden
                    />
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {a.pct.toFixed(1)}% del total
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  )
}
