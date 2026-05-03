"use client"

import { useState } from "react"
import { ShieldCheck, Loader2, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TwoFactorSecurityCardProps {
  enabled: boolean
}

export function TwoFactorSecurityCard({ enabled }: TwoFactorSecurityCardProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)

  const statusLabel = isEnabled ? "ACTIVO" : "INACTIVO"

  const startSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/user/two-factor/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos iniciar la configuración de 2FA")
      }

      setQrCodeDataUrl(payload.qrCodeDataUrl)
      setSecret(payload.secret)
      setOtpauthUrl(payload.otpauthUrl)
      setIsEnabled(true)
      setDialogOpen(true)
      toast.success("Generamos el QR para 2FA")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error iniciando 2FA")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <li className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-sm font-semibold text-foreground">
              Verificación en dos pasos
            </div>
            <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
              Capa extra de seguridad al iniciar sesión.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
              isEnabled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            {statusLabel}
          </span>
          <Button
            type="button"
            variant={isEnabled ? "outline" : "default"}
            size="sm"
            onClick={startSetup}
            disabled={loading}
            className="h-8 gap-2"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="h-3.5 w-3.5" aria-hidden />
            )}
            {isEnabled ? "Reconfigurar" : "Configurar"}
          </Button>
        </div>
      </li>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar 2FA</DialogTitle>
            <DialogDescription>
              Escaneá el QR con una app autenticadora y guardá el secreto en un lugar seguro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCodeDataUrl ? (
              <div className="flex justify-center rounded-xl border border-border bg-white p-4">
                <img
                  src={qrCodeDataUrl}
                  alt="Código QR para 2FA"
                  className="h-48 w-48"
                />
              </div>
            ) : null}

            {otpauthUrl ? (
              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  URL OTP
                </div>
                <div className="break-all rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                  {otpauthUrl}
                </div>
              </div>
            ) : null}

            {secret ? (
              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Secreto base32
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground">
                  {secret}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
