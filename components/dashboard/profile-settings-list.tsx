"use client"

import React from "react"
import { Bell, KeyRound, ShieldCheck } from "lucide-react"
import { useClerk } from "@clerk/nextjs"
import { toast } from "sonner"

interface ProfileSettingsListProps {
  twoFactorEnabled: boolean
}

export function ProfileSettingsList({ twoFactorEnabled }: ProfileSettingsListProps) {
  const { openUserProfile } = useClerk()

  const handleOpenSecurity = () => {
    openUserProfile()
  }

  const handleNotifications = () => {
    toast.info("El sistema de notificaciones se activará en la próxima actualización.")
  }

  return (
    <ul className="divide-y divide-border">
      {/* 2FA */}
      <li className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-sm font-semibold text-foreground">Verificación en dos pasos</div>
            <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
              Gestioná la autenticación multifactor desde la configuración de tu cuenta.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${twoFactorEnabled ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
            {twoFactorEnabled ? "ACTIVO" : "INACTIVO"}
          </span>
          <button 
            onClick={handleOpenSecurity}
            className="text-xs font-medium text-primary hover:underline"
          >
            Configurar
          </button>
        </div>
      </li>

      {/* Notificaciones */}
      <li className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-sm font-semibold text-foreground">Notificaciones</div>
            <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
              Alertas de movimientos y noticias relevantes.
            </p>
          </div>
        </div>
        <button 
          onClick={handleNotifications}
          className="shrink-0 rounded-md bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary/80"
        >
          Ver
        </button>
      </li>

      {/* Sesiones */}
      <li className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-sm font-semibold text-foreground">Sesiones activas</div>
            <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
              Revisá los dispositivos con acceso a tu cuenta.
            </p>
          </div>
        </div>
        <button 
          onClick={handleOpenSecurity}
          className="shrink-0 rounded-md bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary/80"
        >
          Ver
        </button>
      </li>
    </ul>
  )
}
