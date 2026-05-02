"use client"

import { useMemo, useState } from "react"
import type { Order } from "@/lib/types/portfolio"
import { RecentMovements } from "@/components/dashboard/recent-movements"

const FILTERS = [
  { label: "Todas", value: "all" },
  { label: "Compras", value: "buy" },
  { label: "Ventas", value: "sell" },
  { label: "Pendientes", value: "pending" },
  { label: "Completadas", value: "completed" },
] as const

type FilterValue = (typeof FILTERS)[number]["value"]

export function MovementsControls({ orders }: { orders: Order[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all")

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeFilter === "all") return true
      if (activeFilter === "buy") return order.type === "BUY"
      if (activeFilter === "sell") return order.type === "SELL"
      if (activeFilter === "pending") return order.status === "PENDING"
      return order.status === "COMPLETED"
    })
  }, [orders, activeFilter])

  return (
    <div className="space-y-4">
      <section aria-label="Filtros" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Filtrar:
        </span>
        {FILTERS.map((filter) => {
          const active = filter.value === activeFilter
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          )
        })}
      </section>

      <RecentMovements orders={filteredOrders} />
    </div>
  )
}
