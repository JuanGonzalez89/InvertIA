import { Settings, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProfileCardProps {
  name: string
  baseCurrency: string
  assetsCount: number
  gainLossPercent: number
}

export function ProfileCard({
  name,
  baseCurrency,
  assetsCount,
  gainLossPercent,
}: ProfileCardProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "IV"

  return (
    <section
      id="perfil"
      aria-labelledby="profile-title"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between">
        <h2
          id="profile-title"
          className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          Perfil
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Configuración"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-mono text-base font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold leading-tight text-foreground">
            {name}
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-primary" aria-hidden />
            Cuenta verificada
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Tipo de inversor
          </dt>
          <dd className="mt-1 font-mono text-sm font-medium text-foreground">
            Moderado
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Moneda
          </dt>
          <dd className="mt-1 font-mono text-sm font-medium text-foreground">{baseCurrency}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Activos
          </dt>
          <dd className="mt-1 font-mono text-sm font-medium text-foreground">{assetsCount}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Rendimiento
          </dt>
          <dd className="mt-1 font-mono text-sm font-medium text-primary">
            {gainLossPercent >= 0 ? "+" : ""}
            {gainLossPercent.toFixed(2)}%
          </dd>
        </div>
      </dl>
    </section>
  )
}
