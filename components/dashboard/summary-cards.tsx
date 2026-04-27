import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Coins,
  PiggyBank,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"

interface SummaryCardProps {
  label: string
  value: string
  delta?: string
  positive?: boolean
  icon: LucideIcon
  highlight?: boolean
}

function SummaryCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
  highlight,
}: SummaryCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card p-4 transition-colors ${
        highlight
          ? "border-primary/40 bg-gradient-to-br from-primary/[0.07] to-card"
          : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            highlight
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-primary"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
              positive
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3 w-3" aria-hidden />
            )}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-3.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
        {value}
      </div>
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
        />
      )}
    </div>
  )
}

export function SummaryCards() {
  return (
    <section aria-labelledby="summary-title">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="summary-title"
          className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          Resumen general
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground/70">
          Actualizado hace 12s
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label="Valor cartera"
          value="$ 2.780.000"
          delta="+1,8%"
          positive
          icon={Briefcase}
          highlight
        />
        <SummaryCard
          label="Total invertido"
          value="$ 2.450.000"
          icon={PiggyBank}
        />
        <SummaryCard
          label="Liquidez"
          value="$ 420.000"
          icon={Wallet}
        />
        <SummaryCard
          label="Ganancia total"
          value="+ $ 330.000"
          delta="+13,46%"
          positive
          icon={TrendingUp}
        />
        <SummaryCard
          label="Rendimiento"
          value="+13,46%"
          delta="vs costo"
          positive
          icon={ArrowUpRight}
        />
        <SummaryCard label="Activos" value="6" icon={Coins} />
      </div>
    </section>
  )
}
