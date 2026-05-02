import { ArrowDownLeft, ArrowUpRight, CircleCheck, CircleDashed, Receipt } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { RecentMovements } from "@/components/dashboard/recent-movements"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getRecentOrders } from "@/lib/services/portfolio.service"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

const FILTERS = ["Todas", "Compras", "Ventas", "Pendientes", "Completadas"]

export default async function MovimientosPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const recentOrders = await getRecentOrders(user.id, 20)

  const totalCompras = recentOrders
    .filter((order) => order.type === "BUY")
    .reduce((acc, order) => acc + order.totalAmount, 0)
  const totalVentas = recentOrders
    .filter((order) => order.type === "SELL")
    .reduce((acc, order) => acc + order.totalAmount, 0)
  const completadas = recentOrders.filter((order) => order.status === "COMPLETED")
  const pendientes = recentOrders.filter((order) => order.status === "PENDING")

  const stats = [
    {
      label: "Total compras",
      value: `$ ${totalCompras.toLocaleString("es-AR")}`,
      helper: `Ultimos ${recentOrders.length} movimientos`,
      icon: ArrowDownLeft,
      tone: "primary" as const,
    },
    {
      label: "Total ventas",
      value: `$ ${totalVentas.toLocaleString("es-AR")}`,
      helper: `Ultimos ${recentOrders.length} movimientos`,
      icon: ArrowUpRight,
      tone: "destructive" as const,
    },
    {
      label: "Operaciones completadas",
      value: completadas.length.toString(),
      helper: "Sincronizado con base de datos",
      icon: CircleCheck,
      tone: "primary" as const,
    },
    {
      label: "Pendientes",
      value: pendientes.length.toString(),
      helper: pendientes[0]?.ticker ? `${pendientes[0].ticker} pendiente` : "Sin pendientes",
      icon: CircleDashed,
      tone: "muted" as const,
    },
  ]

  return (
    <>
      <PageHeader
        icon={Receipt}
        eyebrow="Movimientos"
        title="Historial de operaciones"
        description="Compras, ventas y movimientos pendientes de tu cartera, con detalle por activo y fecha."
        meta={
          <Button
            size="sm"
            className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Exportar CSV
          </Button>
        }
      />

      {/* Stats */}
      <section
        aria-label="Resumen de movimientos"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {stats.map((s) => {
          const Icon = s.icon
          const toneClasses =
            s.tone === "primary"
              ? "bg-primary/10 text-primary"
              : s.tone === "destructive"
                ? "bg-destructive/15 text-destructive"
                : "bg-secondary text-muted-foreground"
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
              <div className="mt-3 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                {s.value}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {s.helper}
              </div>
            </div>
          )
        })}
      </section>

      {/* Filters */}
      <section
        aria-label="Filtros"
        className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Filtrar:
        </span>
        {FILTERS.map((f, i) => (
          <button
            key={f}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              i === 0
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      <RecentMovements orders={recentOrders.slice(0, 5)} />
    </>
  )
}
