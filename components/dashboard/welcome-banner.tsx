import { Activity, Calendar } from "lucide-react"

interface WelcomeBannerProps {
  userName: string
  marketOpen: boolean
  marketStatusLabel: string
}

export function WelcomeBanner({
  userName,
  marketOpen,
  marketStatusLabel,
}: WelcomeBannerProps) {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })

  return (
    <section
      id="inicio"
      aria-labelledby="welcome-title"
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          <span className="capitalize">{today}</span>
        </div>
        <h1
          id="welcome-title"
          className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Hola, bienvenido a InvertIA,{" "}
          <span className="text-primary">{userName}</span>
        </h1>
        <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Gestioná tu cartera, analizá tus CEDEARs y tomá decisiones con ayuda de
          inteligencia artificial.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1.5 sm:self-end">
        <Activity
          className={`h-3.5 w-3.5 ${marketOpen ? "text-primary" : "text-muted-foreground"}`}
          aria-hidden
        />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {marketStatusLabel}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${marketOpen ? "bg-primary terminal-pulse" : "bg-muted-foreground/60"}`}
          aria-hidden
        />
      </div>
    </section>
  )
}
