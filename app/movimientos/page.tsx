import { ArrowDownLeft, ArrowUpRight, CircleCheck, CircleDashed, Receipt } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { RecentMovements } from "@/components/dashboard/recent-movements"
import { Button } from "@/components/ui/button"

const STATS = [
  {
    label: "Total compras",
    value: "$ 724.450",
    helper: "Últimos 30 días",
    icon: ArrowDownLeft,
    tone: "primary" as const,
  },
  {
    label: "Total ventas",
    value: "$ 264.000",
    helper: "Últimos 30 días",
    icon: ArrowUpRight,
    tone: "destructive" as const,
  },
  {
    label: "Operaciones completadas",
    value: "12",
    helper: "Sin errores",
    icon: CircleCheck,
    tone: "primary" as const,
  },
  {
    label: "Pendientes",
    value: "1",
    helper: "TX26 · Bono Tesoro",
    icon: CircleDashed,
    tone: "muted" as const,
  },
]

const FILTERS = ["Todas", "Compras", "Ventas", "Pendientes", "Completadas"]

export default function MovimientosPage() {
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
        {STATS.map((s) => {
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

      <RecentMovements />
    </>
  )
}
