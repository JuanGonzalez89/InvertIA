"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  MoreHorizontal,
  Pencil,
  Trash2,
  PlusIcon,
} from "lucide-react"
import type { Asset } from "@/lib/types/portfolio"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatARS, formatMoney } from "@/lib/utils"
import { clearPortfolio, deletePosition } from "@/lib/services/actions.service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { NewTransactionDialog } from "./new-transaction-dialog"
import { EditPositionDialog } from "./edit-position-dialog"
import React from "react"

const TYPE_LABELS: Record<string, string> = {
  ACCION: "Acción",
  CEDEAR: "CEDEAR",
  ETF: "ETF",
  BONO: "Bono",
}

const TYPE_STYLES: Record<string, string> = {
  ACCION: "bg-primary/10 text-primary",
  CEDEAR: "bg-cyan-500/10 text-cyan-400",
  ETF: "bg-emerald-500/10 text-emerald-400",
  BONO: "bg-amber-500/10 text-amber-400",
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
  const [editingAsset, setEditingAsset] = React.useState<Asset | null>(null)
  const suppressNextRowNavigationRef = React.useRef(false)
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

  const openAssetDetail = (ticker: string) => {
    if (suppressNextRowNavigationRef.current) {
      suppressNextRowNavigationRef.current = false
      return
    }

    router.push(`/activo/${encodeURIComponent(ticker)}`)
  }

  const formatArsValue = (value: number) => formatMoney(Math.round(value), 'ARS')

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
        <div className="flex items-center gap-2">
          {userId && (
            <NewTransactionDialog 
              userId={userId} 
              trigger={
                <Button size="sm" className="h-8 gap-1.5">
                  <PlusIcon className="h-3.5 w-3.5" />
                  Agregar
                </Button>
              }
            />
          )}
          {showActions && hasActions && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleEmptyPortfolio}
              className="h-8 border-border bg-transparent text-muted-foreground hover:bg-secondary"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Vaciar
            </Button>
          )}
        </div>
      </div>

      {/* Table header */}
      <div
        className={cn(
          "hidden gap-3 border-b border-border px-5 py-2 md:grid",
          hasActions
            ? "md:grid-cols-[1.45fr_0.82fr_0.7fr_0.7fr_0.95fr_0.95fr_0.85fr_0.3fr]"
            : "md:grid-cols-[1.45fr_0.82fr_0.7fr_0.7fr_0.95fr_0.95fr_0.85fr]",
        )}
      >
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Ticker
        </div>
        <div className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Tipo
        </div>
        <div className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Nominales
        </div>
        <div className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Precio
        </div>
        <div className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          V. Actual
        </div>
        <div className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          V. Inicial
        </div>
        <div className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Rendimiento
        </div>
        {hasActions && (
          <div className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
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
          <div className="flex gap-2 mt-2">
            {userId && <NewTransactionDialog userId={userId} />}
            <Button asChild variant="outline">
              <a href={emptyActionHref}>Importar CSV/Excel</a>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((asset) => {
            const currentPrice = asset.currentPriceArs ?? asset.currentPrice ?? asset.avgBuyPrice ?? 0
            const initialPrice = asset.avgBuyPrice ?? 0
            const initialValue = asset.investedValueArs ?? (asset.quantity * initialPrice)
            const currentValue = asset.currentValueArs ?? (asset.quantity * currentPrice)
            const gainLoss = asset.gainLossValueArs ?? (currentValue - initialValue)
            const gainLossPercent = initialValue > 0 ? (gainLoss / initialValue) * 100 : 0
            const positive = gainLoss >= 0
            return (
              <li
                key={asset.id}
                role="button"
                tabIndex={0}
                onClick={() => openAssetDetail(asset.ticker)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    openAssetDetail(asset.ticker)
                  }
                }}
                className={cn(
                  "grid cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40",
                  hasActions
                    ? "grid-cols-[1fr_auto] md:grid-cols-[1.45fr_0.82fr_0.7fr_0.7fr_0.95fr_0.95fr_0.85fr_0.3fr]"
                    : "grid-cols-[1fr] md:grid-cols-[1.45fr_0.82fr_0.7fr_0.7fr_0.95fr_0.95fr_0.85fr]",
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
                    <div className="mt-1 md:hidden">
                      <span
                        className={`inline-flex rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${TYPE_STYLES[asset.type?.toUpperCase() ?? ""] ?? "bg-secondary text-muted-foreground"}`}
                      >
                        {TYPE_LABELS[asset.type?.toUpperCase() ?? ""] ?? asset.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${TYPE_STYLES[asset.type?.toUpperCase() ?? ""] ?? "bg-secondary text-muted-foreground"}`}
                  >
                    {TYPE_LABELS[asset.type?.toUpperCase() ?? ""] ?? asset.type}
                  </span>
                </div>

                <div className="grid gap-2 text-[11px] text-muted-foreground md:hidden">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-mono uppercase tracking-wider">Nominales</div>
                      <div className="font-mono text-sm tabular-nums text-foreground">{asset.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono uppercase tracking-wider">Precio</div>
                      <div className="font-mono text-sm tabular-nums text-foreground">{formatArsValue(currentPrice)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-mono uppercase tracking-wider">V. Actual</div>
                      <div className="font-mono text-sm tabular-nums text-foreground">{formatArsValue(currentValue)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono uppercase tracking-wider">V. Inicial</div>
                      <div className="font-mono text-sm tabular-nums text-foreground">{formatArsValue(initialValue)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase tracking-wider">Rendimiento</span>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${positive
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                        }`}
                    >
                      {positive ? (
                        <ArrowUpRight className="h-3 w-3" aria-hidden />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" aria-hidden />
                      )}
                      {`${gainLossPercent >= 0 ? "+" : ""}${gainLossPercent.toFixed(2)}%`}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-center font-mono text-sm tabular-nums text-foreground">
                  {asset.quantity}
                </div>

                <div className="hidden md:flex items-center justify-center font-mono text-sm tabular-nums text-foreground">
                  {formatArsValue(currentPrice)}
                </div>

                <div className="hidden md:flex items-center justify-center font-mono text-sm tabular-nums text-foreground">
                  {formatArsValue(currentValue)}
                </div>

                <div className="hidden md:flex items-center justify-center font-mono text-sm tabular-nums text-foreground">
                  {formatArsValue(initialValue)}
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <div
                    className={`inline-flex items-center justify-end gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${positive
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-red-500/10 text-red-500"
                      }`}
                  >
                    {positive ? (
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" aria-hidden />
                    )}
                    {`${gainLossPercent >= 0 ? "+" : ""}${gainLossPercent.toFixed(2)}%`}
                  </div>
                </div>

                {hasActions && (
                  <div className="hidden items-center justify-end md:flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          onClick={(event) => event.stopPropagation()}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Acciones"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={() => {
                            suppressNextRowNavigationRef.current = true
                            setEditingAsset(asset)
                          }}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                          Editar posición
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

      {userId ? (
        <EditPositionDialog
          userId={userId}
          asset={editingAsset}
          open={editingAsset !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAsset(null)
            }
          }}
        />
      ) : null}
    </section>
  )
}
