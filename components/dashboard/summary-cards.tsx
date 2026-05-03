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
import type { Portfolio } from "@/lib/types/portfolio"
import { formatARS, formatPercent } from "@/lib/utils"

interface SummaryCardProps {
  label: string
  value: string
  delta?: string
  positive?: boolean
  icon: LucideIcon
  highlight?: boolean
  valueTone?: "positive" | "negative"
}

function SummaryCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
  highlight,
  valueTone,
}: SummaryCardProps) {
  const valueToneClasses =
    valueTone === "positive"
      ? "text-emerald-500"
      : valueTone === "negative"
        ? "text-red-500"
        : "text-foreground"
  const valueBgClasses =
    valueTone === "positive"
      ? "bg-emerald-500/10"
      : valueTone === "negative"
        ? "bg-red-500/10"
        : ""
  const valuePillClasses = valueTone ? "rounded-md px-2 py-0.5" : ""

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
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500"
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
      <div className="mt-1 min-w-0">
        <span
          className={`inline-flex max-w-full truncate font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${valueToneClasses} ${valueBgClasses} ${valuePillClasses}`}
        >
          {value}
        </span>
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

export function SummaryCards({ portfolio }: { portfolio: Portfolio }) {
  const safeGainLossPercent =
    portfolio.totalInvested > 0 && Number.isFinite(portfolio.gainLossPercent)
      ? portfolio.gainLossPercent
      : 0
  const gainIsPositive = portfolio.totalGainLoss >= 0
  const totalGainLabel = formatARS(portfolio.totalGainLoss)
  const totalGainPct = `${safeGainLossPercent >= 0 ? "+" : ""}${formatPercent(
    safeGainLossPercent,
  )}`

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
          value={formatARS(portfolio.totalCurrentValue)}
          delta={totalGainPct}
          positive={gainIsPositive}
          icon={Briefcase}
          highlight
        />
        <SummaryCard
          label="Total invertido"
          value={formatARS(portfolio.totalInvested)}
          icon={PiggyBank}
        />
        <SummaryCard
          label="Ganancia total"
          value={totalGainLabel}
          delta={totalGainPct}
          positive={gainIsPositive}
          valueTone={gainIsPositive ? "positive" : "negative"}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Rendimiento"
          value={totalGainPct}
          delta="vs costo"
          positive={gainIsPositive}
          valueTone={gainIsPositive ? "positive" : "negative"}
          icon={ArrowUpRight}
        />
        <SummaryCard
          label="Activos"
          value={portfolio.assets.length.toString()}
          icon={Coins}
        />
      </div>
    </section>
  )
}
