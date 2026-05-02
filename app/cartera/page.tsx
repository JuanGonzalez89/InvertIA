import { Briefcase, Coins, PieChart, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { PortfolioHoldings } from "@/components/dashboard/portfolio-holdings"
import { LiquidityCard } from "@/components/dashboard/liquidity-card"
import { ImportPortfolio } from "@/components/dashboard/import-portfolio"
import { DataErrorState } from "@/components/dashboard/data-error-state"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getPortfolio } from "@/lib/services/portfolio.service"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

export default async function CarteraPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  let user = null

  try {
    user = await getCurrentUser()
  } catch {
    return (
      <DataErrorState
        title="No pudimos cargar tu cartera"
        description="Tu sesion esta activa, pero no pudimos sincronizar tu usuario con la base de datos."
      />
    )
  }

  if (!user) {
    return (
      <DataErrorState
        title="No pudimos cargar tu cartera"
        description="Tu sesion esta activa, pero no encontramos el usuario en la base de datos."
      />
    )
  }

  // Ahora sacamos los datos reales desde la BD
  const portfolio = await getPortfolio(user.id)

  const ALLOCATION = [
    { label: "Acciones", value: "$ 0", pct: 0, color: "bg-primary" },
    { label: "Bonos", value: "$ 0", pct: 0, color: "bg-chart-4" },
    { label: "CEDEARs", value: "$ 0", pct: 0, color: "bg-chart-3" },
    { label: "ETFs", value: "$ 0", pct: 0, color: "bg-secondary" },
  ] // TODO: Dynamic map en Fase 4

  const STATS = [
    { label: "Valor cartera", value: `$ ${portfolio.totalCurrentValue.toLocaleString('es-AR')}`, icon: Briefcase },
    { label: "Total invertido", value: `$ ${portfolio.totalInvested.toLocaleString('es-AR')}`, icon: Coins },
    { label: "Ganancia/Pérdida", value: `$ ${portfolio.totalGainLoss.toLocaleString('es-AR')}`, icon: TrendingUp, accent: true },
    { label: "Rendimiento", value: `${portfolio.gainLossPercent.toFixed(2)}%`, icon: PieChart, accent: true },
  ]

  return (
    <>
      <PageHeader
        icon={Briefcase}
        eyebrow="Mi cartera"
        title={`Panel de ${user.name.split(' ')[0]}`}
        description="Visualizá tus activos reales guardados en base de datos."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary terminal-pulse" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {portfolio.assets.length} activos · {user.baseCurrency}
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
          <PortfolioHoldings assets={portfolio.assets} />
        </div>

        <aside className="space-y-6" aria-label="Distribución y liquidez">
          <LiquidityCard
            liquidityARS={portfolio.liquidityARS}
            totalCurrentValue={portfolio.totalCurrentValue}
          />

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
