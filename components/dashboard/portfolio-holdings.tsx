"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { Sparkline } from "./sparkline"
import type { Asset } from "@/lib/types/portfolio"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatARS } from "@/lib/utils"
import { clearPortfolio, deletePosition } from "@/lib/services/actions.service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const TYPE_COLORS: Record<string, string> = {
  ACCION: "bg-primary/10 text-primary",
  CEDEAR: "bg-chart-3/15 text-chart-3",
  BONO: "bg-chart-4/15 text-chart-4",
  ETF: "bg-secondary text-foreground",
}

export function PortfolioHoldings({
  assets,
  showActions = false,
  emptyActionHref = "#importar",
  userId,
}: {
  assets?: Asset[]
  showActions?: boolean
  emptyActionHref?: string
  userId?: string
}) {
  const router = useRouter()
  const list = assets ?? []
  const hasActions = showActions && list.length > 0

  const handleEmptyPortfolio = async () => {
    if (!userId) return
    if (!confirm("¿Estás seguro de que quieres vaciar toda tu cartera?")) return
    
    const promise = clearPortfolio(userId)
    toast.promise(promise, {
      loading: 'Vaciando cartera...',
      success: 'Cartera vaciada correctamente',
      error: 'Error al vaciar la cartera'
    })
    
    const res = await promise
    if (res.success) router.refresh()
  }

  const handleDeletePosition = async (id: string) => {
    if (!confirm("¿Eliminar este activo de tu cartera?")) return
    
    const promise = deletePosition(id)
    toast.promise(promise, {
      loading: 'Eliminando activo...',
      success: 'Activo eliminado',
      error: 'Error al eliminar el activo'
    })
    
    const res = await promise
    if (res.success) router.refresh()
  }

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
        {showActions ? (
          hasActions ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleEmptyPortfolio}
              className="h-8 border-border bg-transparent text-muted-foreground hover:bg-secondary"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Vaciar Cartera
            </Button>
          ) : null
        ) : (
          <a
            href="#"
            className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
          >
            Ver todo →
          </a>
        )}
      </div>

      {/* Table header */}
      <div
        className={cn(
          "hidden gap-3 border-b border-border px-5 py-2 md:grid",
          hasActions
            ? "md:grid-cols-[1.6fr_0.7fr_0.6fr_1fr_1fr_0.8fr_0.3fr]"
            : "md:grid-cols-[1.6fr_0.7fr_0.6fr_1fr_1fr_0.8fr]",
        )}
      >
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
        {hasActions && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
            Acciones
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Briefcase className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Tu cartera está vacía</h3>
            <p className="text-sm text-muted-foreground">
              Agregá tu primer activo para empezar a invertir.
            </p>
          </div>
          <Button asChild className="mt-2">
            <a href={emptyActionHref}>Agregar primer activo</a>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((asset) => {
            const total = asset.quantity * (asset.currentPrice || asset.avgBuyPrice || 0)
            const delta = Number.isFinite(asset.dailyChangePercent)
              ? asset.dailyChangePercent
              : 0
            const positive = delta >= 0
            return (
              <li
                key={asset.ticker}
                className={cn(
                  "grid items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40",
                  hasActions
                    ? "grid-cols-[1.4fr_1fr_0.8fr_auto] md:grid-cols-[1.6fr_0.7fr_0.6fr_1fr_1fr_0.8fr_0.3fr]"
                    : "grid-cols-[1.6fr_1fr_0.8fr] md:grid-cols-[1.6fr_0.7fr_0.6fr_1fr_1fr_0.8fr]",
                )}
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
                    className={`inline-flex rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${TYPE_COLORS[asset.type?.toUpperCase() ?? ""]}`}
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
                  {formatARS((asset.currentPrice ?? asset.avgBuyPrice) || 0)}
                </div>

                {/* Value / delta */}
                <div className="text-right">
                  <div className="font-mono text-sm font-medium tabular-nums text-foreground">
                    {formatARS(total)}
                  </div>
                  <div
                      className={`inline-flex items-center justify-end gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
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
                    {`${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`}
                  </div>
                </div>

                {/* Sparkline */}
                <div className="h-10 w-full">
                  <Sparkline data={asset.sparkline ?? []} positive={positive} className="h-full w-full" />
                </div>

                {hasActions && (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Acciones"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2">
                          <Pencil className="h-4 w-4" aria-hidden />
                          Modificar cantidad
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-red-500 focus:text-red-500"
                          onClick={() => handleDeletePosition(asset.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Eliminar activo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
