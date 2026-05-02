import { ArrowDownRight, ArrowUpRight, Briefcase } from "lucide-react"
import { Sparkline } from "./sparkline"
import type { Asset } from "@/lib/types/portfolio"

const TYPE_COLORS: Record<string, string> = {
  ACCION: "bg-primary/10 text-primary",
  CEDEAR: "bg-chart-3/15 text-chart-3",
  BONO: "bg-chart-4/15 text-chart-4",
  ETF: "bg-secondary text-foreground",
}

export function PortfolioHoldings({ assets }: { assets?: Asset[] }) {
  const list = assets ?? [];

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
            {list.length} activos
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
        {list.map((asset) => {
          const total = asset.quantity * (asset.currentPrice || asset.avgBuyPrice || 0)
          const delta = asset.dailyChangePercent ?? 0
          const positive = delta >= 0
          return (
            <li
              key={asset.ticker}
              className="grid grid-cols-[1.6fr_1fr_0.8fr] md:grid-cols-[1.6fr_0.7fr_0.6fr_1fr_1fr_0.8fr] items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40"
            >
              {/* Asset */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-[10px] font-semibold text-foreground">
                  {asset.ticker.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold leading-tight text-foreground">
                    {asset.ticker}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {asset.name}
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="hidden md:block">
                <span
                  className={`inline-flex rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${TYPE_COLORS[asset.type?.toUpperCase() ?? '']}`}
                >
                  {asset.type}
                </span>
              </div>

              {/* Qty */}
              <div className="hidden md:block text-right font-mono text-sm tabular-nums text-foreground">
                {asset.quantity}
              </div>

              {/* Price */}
              <div className="hidden md:block text-right font-mono text-sm tabular-nums text-foreground">
                {`$ ${((asset.currentPrice ?? asset.avgBuyPrice) || 0).toLocaleString('es-AR')}`}
              </div>

              {/* Value / delta */}
              <div className="text-right">
                <div className="font-mono text-sm font-medium tabular-nums text-foreground">
                  {`$ ${total.toLocaleString('es-AR')}`}
                </div>
                <div
                  className={`inline-flex items-center justify-end gap-0.5 font-mono text-[11px] tabular-nums ${
                    positive ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" aria-hidden />
                  )}
                  {`${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`}
                </div>
              </div>

              {/* Sparkline */}
              <div className="h-10 w-full">
                <Sparkline data={asset.sparkline ?? []} positive={positive} className="h-full w-full" />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
