import { Briefcase, Coins, PieChart, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { PortfolioHoldings } from "@/components/dashboard/portfolio-holdings"
import { ImportPortfolio } from "@/components/dashboard/import-portfolio"
import { DataErrorState } from "@/components/dashboard/data-error-state"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getPortfolio } from "@/lib/services/portfolio.service"
import { formatARS, formatPercent } from "@/lib/utils"
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

  // Si el usuario no completó el perfil, redirigimos al onboarding/editar perfil
  if (!(user as any).phone) {
    redirect('/perfil/editar')
  }

  // Ahora sacamos los datos reales desde la BD
  const portfolio = await getPortfolio(user.id)

  // Cálculo dinámico de distribución por tipo
  const allocationMap = portfolio.assets.reduce((acc, asset) => {
    const type = asset.type || 'OTRO';
    const value = asset.quantity * (asset.currentPrice || 0);
    acc[type] = (acc[type] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const ALLOCATION = Object.entries(allocationMap).map(([type, value]) => {
    const labels: Record<string, string> = {
      'STOCK': 'Acciones',
      'BOND': 'Bonos',
      'CEDEAR': 'CEDEARs',
      'ETF': 'ETFs',
      'OTRO': 'Otros'
    };
    const colors: Record<string, string> = {
      'STOCK': 'bg-primary',
      'BOND': 'bg-chart-4',
      'CEDEAR': 'bg-chart-3',
      'ETF': 'bg-secondary',
      'OTRO': 'bg-zinc-500'
    };
    const pct = portfolio.totalCurrentValue > 0 ? (value / portfolio.totalCurrentValue) * 100 : 0;
    
    return {
      label: labels[type] || type,
      value: formatARS(value),
      pct,
      color: colors[type] || 'bg-zinc-500'
    };
  }).sort((a, b) => b.pct - a.pct);

  const safeGainLossPercent =
    portfolio.totalInvested > 0 && Number.isFinite(portfolio.gainLossPercent)
      ? portfolio.gainLossPercent
      : 0
  const gainIsPositive = portfolio.totalGainLoss >= 0

  const STATS = [
    { label: "Valor cartera", value: formatARS(portfolio.totalCurrentValue), icon: Briefcase },
    { label: "Total invertido", value: formatARS(portfolio.totalInvested), icon: Coins },
    {
      label: "Ganancia/Pérdida",
      value: formatARS(portfolio.totalGainLoss),
      icon: TrendingUp,
      tone: gainIsPositive ? "positive" : "negative",
    },
    {
      label: "Rendimiento",
      value: formatPercent(safeGainLossPercent),
      icon: PieChart,
      tone: gainIsPositive ? "positive" : "negative",
    },
  ]

  return (
    <>
      <PageHeader
        icon={Briefcase}
        eyebrow="Mi cartera"
        title={`Panel de ${user.name}`}
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
          const valueTone =
            s.tone === "positive"
              ? "text-emerald-500"
              : s.tone === "negative"
                ? "text-red-500"
                : "text-foreground"
          const valueBg =
            s.tone === "positive"
              ? "bg-emerald-500/10"
              : s.tone === "negative"
                ? "bg-red-500/10"
                : ""
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
              <div className="mt-3">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${valueTone} ${valueBg}`}
                >
                  {s.value}
                </span>
              </div>
            </div>
          )
        })}
      </section>

      <ImportPortfolio />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PortfolioHoldings 
            assets={portfolio.assets} 
            showActions 
            emptyActionHref="#import-portfolio" 
            userId={user.id} 
          />
        </div>

        <aside className="space-y-6" aria-label="Distribución">

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
