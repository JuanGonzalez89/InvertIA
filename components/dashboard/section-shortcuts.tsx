import Link from "next/link"
import {
  ArrowRight,
  Bot,
  Briefcase,
  LineChart,
  Receipt,
  UserCircle2,
  type LucideIcon,
} from "lucide-react"

interface Shortcut {
  href: string
  title: string
  description: string
  icon: LucideIcon
  meta: string
  highlight?: boolean
}

const SHORTCUTS: Shortcut[] = [
  {
    href: "/cartera",
    title: "Mi cartera",
    description: "Activos, valuación y rendimiento detallado.",
    icon: Briefcase,
    meta: "6 activos",
    highlight: true,
  },
  {
    href: "/mercado",
    title: "Mercado",
    description: "Acciones, CEDEARs e índices en tiempo real.",
    icon: LineChart,
    meta: "12 destacadas",
  },
  {
    href: "/movimientos",
    title: "Movimientos",
    description: "Historial de compras, ventas y operaciones.",
    icon: Receipt,
    meta: "5 recientes",
  },
  {
    href: "/chat",
    title: "Chat IA",
    description: "Asistente financiero con análisis y ejecución.",
    icon: Bot,
    meta: "Online",
  },
  {
    href: "/perfil",
    title: "Perfil",
    description: "Datos de cuenta, liquidez y configuración.",
    icon: UserCircle2,
    meta: "Verificado",
  },
]

export function SectionShortcuts() {
  return (
    <section aria-labelledby="shortcuts-title">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="shortcuts-title"
          className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          Accesos rápidos
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground/70">
          {SHORTCUTS.length} secciones
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className={`group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 transition-colors ${
                  s.highlight
                    ? "border-primary/40 bg-gradient-to-br from-primary/[0.07] to-card hover:border-primary/60"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      s.highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.meta}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">
                    {s.title}
                  </div>
                  <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors group-hover:text-primary">
                  Ir a la sección
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
                {s.highlight && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
