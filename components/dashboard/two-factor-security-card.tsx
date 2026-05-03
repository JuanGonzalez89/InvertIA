"use client"

import { ShieldCheck } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

interface TwoFactorSecurityCardProps {
  enabled: boolean
}

// Simplified card that defers 2FA management to Clerk's native UI.
// Removes custom backend 2FA flows and exposes the Clerk user control.
export function TwoFactorSecurityCard({ enabled }: TwoFactorSecurityCardProps) {
  const statusLabel = enabled ? "ACTIVO" : "INACTIVO"

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="text-sm font-semibold text-foreground">Verificación en dos pasos</div>
          <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
            Gestioná la autenticación multifactor desde la configuración de tu cuenta (Clerk).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`inline-flex shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${enabled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
          {statusLabel}
        </span>
        <UserButton />
      </div>
    </li>
  )
}
