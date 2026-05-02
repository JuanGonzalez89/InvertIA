"use client"

import { ArrowDownLeft, ArrowUpRight, Clock, Receipt, Trash2 } from "lucide-react"
import type { Order } from "@/lib/types/portfolio"
import { formatARS } from "@/lib/utils"
import { deleteMovement } from "@/lib/services/actions.service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Movement {
  id: string
  type: "compra" | "venta"
  ticker: string
  name: string
  qty: number
  unitPrice: string
  total: string
  date: string
  status: "completado" | "pendiente" | "cancelado"
}

const STATUS_STYLES: Record<Movement["status"], string> = {
  completado: "bg-primary/10 text-primary",
  pendiente: "bg-chart-4/15 text-chart-4",
  cancelado: "bg-destructive/15 text-destructive",
}

interface RecentMovementsProps {
  orders?: Order[]
}

function toUiMovement(order: Order): Movement {
  return {
    id: order.id,
    type: order.type === "BUY" ? "compra" : "venta",
    ticker: order.ticker,
    name: order.ticker,
    qty: order.quantity,
    unitPrice: formatARS(order.pricePerUnit),
    total: formatARS(order.totalAmount),
    date: order.createdAt instanceof Date 
      ? order.createdAt.toLocaleDateString("es-AR")
      : new Date(order.createdAt).toLocaleDateString("es-AR"),
    status:
      order.status === "COMPLETED"
        ? "completado"
        : order.status === "PENDING"
          ? "pendiente"
          : "cancelado",
  }
}

export function RecentMovements({ orders }: RecentMovementsProps) {
  const router = useRouter()
  const movements = orders?.length ? orders.map(toUiMovement) : []

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento del historial?")) return
    
    const promise = deleteMovement(id)
    toast.promise(promise, {
      loading: 'Eliminando movimiento...',
      success: 'Movimiento eliminado',
      error: 'Error al eliminar el movimiento'
    })
    
    const res = await promise
    if (res.success) router.refresh()
  }

  return (
    <section
      id="movimientos"
      aria-labelledby="movements-title"
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="movements-title" className="text-sm font-semibold text-foreground">
            Movimientos recientes
          </h2>
        </div>
        <a
          href="#"
          className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          Ver historial →
        </a>
      </div>

      <ul className="divide-y divide-border">
        {movements.length === 0 ? (
          <li className="px-5 py-10">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Receipt className="h-4 w-4" aria-hidden />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay movimientos para mostrar con este filtro.
              </p>
            </div>
          </li>
        ) : movements.map((m, i) => (
          <li
            key={`${m.ticker}-${i}`}
            className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-secondary/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                  m.type === "compra"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
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
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[m.status]}`}
                  >
                    {m.status}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 truncate text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="font-mono">{m.date}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline truncate">
                    {m.qty} × {m.unitPrice}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {m.total}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {m.qty} {m.qty === 1 ? "unidad" : "unidades"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="text-muted-foreground transition-colors hover:text-red-500"
                aria-label="Eliminar movimiento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
