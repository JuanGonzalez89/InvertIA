import { ArrowDownLeft, ArrowUpRight, CircleCheck, CircleDashed, Receipt } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { MovementsControls } from "@/components/dashboard/movements-controls"
import { DataErrorState } from "@/components/dashboard/data-error-state"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getRecentOrders } from "@/lib/services/portfolio.service"
import { formatARS } from "@/lib/utils"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

export default async function MovimientosPage() {
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
        title="No pudimos cargar movimientos"
        description="Tu sesion esta activa, pero fallo la sincronizacion con base de datos."
      />
    )
  }

  if (!user) {
    return (
      <DataErrorState
        title="No pudimos cargar movimientos"
        description="Tu sesion esta activa, pero no encontramos tu usuario en base de datos."
      />
    )
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
      value: formatARS(totalCompras),
      helper: `Ultimos ${recentOrders.length} movimientos`,
      icon: ArrowDownLeft,
      tone: "positive" as const,
    },
    {
      label: "Total ventas",
      value: formatARS(totalVentas),
      helper: `Ultimos ${recentOrders.length} movimientos`,
      icon: ArrowUpRight,
      tone: "negative" as const,
    },
    {
      label: "Operaciones completadas",
      value: completadas.length.toString(),
      helper: "Sincronizado con base de datos",
      icon: CircleCheck,
      tone: "positive" as const,
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
            s.tone === "positive"
              ? "bg-emerald-500/10 text-emerald-500"
              : s.tone === "negative"
                ? "bg-red-500/10 text-red-500"
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

      <MovementsControls orders={recentOrders.slice(0, 50)} />
    </>
  )
}
