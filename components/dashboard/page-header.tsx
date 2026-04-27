import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  meta?: React.ReactNode
}

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  meta,
}: PageHeaderProps) {
  return (
    <section className="space-y-3">
      <nav
        aria-label="Migas de pan"
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <Home className="h-3 w-3" aria-hidden />
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="text-foreground">{eyebrow}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {meta && <div className="self-start sm:self-end">{meta}</div>}
      </div>
    </section>
  )
}
