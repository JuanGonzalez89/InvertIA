import { ArrowDownLeft, ArrowUpRight, Clock, Receipt } from "lucide-react"
import type { Order } from "@/lib/types/portfolio"

interface Movement {
  type: "compra" | "venta"
  ticker: string
  name: string
  qty: number
  unitPrice: string
  total: string
  date: string
  status: "completado" | "pendiente" | "cancelado"
}

const MOVEMENTS: Movement[] = [
  {
    type: "compra",
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    qty: 2,
    unitPrice: "$ 38.500",
    total: "$ 77.000",
    date: "24/04/2026",
    status: "completado",
  },
  {
    type: "venta",
    ticker: "VIST",
    name: "Vista Energy",
    qty: 5,
    unitPrice: "$ 52.800",
    total: "$ 264.000",
    date: "23/04/2026",
    status: "completado",
  },
  {
    type: "compra",
    ticker: "YPF",
    name: "YPF S.A.",
    qty: 10,
    unitPrice: "$ 30.500",
    total: "$ 305.000",
    date: "22/04/2026",
    status: "completado",
  },
  {
    type: "compra",
    ticker: "TX26",
    name: "Bono Tesoro",
    qty: 200,
    unitPrice: "$ 1.245",
    total: "$ 249.000",
    date: "21/04/2026",
    status: "pendiente",
  },
  {
    type: "compra",
    ticker: "AAPL",
    name: "Apple Inc.",
    qty: 3,
    unitPrice: "$ 31.150",
    total: "$ 93.450",
    date: "20/04/2026",
    status: "completado",
  },
]

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
    type: order.type === "BUY" ? "compra" : "venta",
    ticker: order.ticker,
    name: order.ticker,
    qty: order.quantity,
    unitPrice: `$ ${order.pricePerUnit.toLocaleString("es-AR")}`,
    total: `$ ${order.totalAmount.toLocaleString("es-AR")}`,
    date: order.createdAt.toLocaleDateString("es-AR"),
    status:
      order.status === "COMPLETED"
        ? "completado"
        : order.status === "PENDING"
          ? "pendiente"
          : "cancelado",
  }
}

export function RecentMovements({ orders }: RecentMovementsProps) {
  const movements = orders?.length ? orders.map(toUiMovement) : MOVEMENTS

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
        {movements.map((m, i) => (
          <li
            key={`${m.ticker}-${i}`}
            className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-secondary/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                  m.type === "compra"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/15 text-destructive"
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

            <div className="text-right">
              <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {m.total}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {m.qty} {m.qty === 1 ? "unidad" : "unidades"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
