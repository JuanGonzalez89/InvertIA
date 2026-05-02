import {
  Bell,
  KeyRound,
  ShieldCheck,
  UserCircle2,
} from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { DataErrorState } from "@/components/dashboard/data-error-state"
import { ProfileInlineDetails } from "@/components/dashboard/profile-inline-details"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getPortfolio } from "@/lib/services/portfolio.service"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

const PREFERENCES = [
  {
    icon: Bell,
    title: "Notificaciones",
    desc: "Alertas de movimientos y noticias relevantes.",
    enabled: true,
  },
  {
    icon: ShieldCheck,
    title: "Verificación en dos pasos",
    desc: "Capa extra de seguridad al iniciar sesión.",
    enabled: true,
  },
  {
    icon: KeyRound,
    title: "Sesiones activas",
    desc: "Revisá los dispositivos con acceso a tu cuenta.",
    enabled: false,
  },
]

export default async function PerfilPage() {
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
        title="No pudimos cargar tu perfil"
        description="Tu sesion esta activa, pero fallo la sincronizacion con base de datos."
      />
    )
  }

  if (!user) {
    return (
      <DataErrorState
        title="No pudimos cargar tu perfil"
        description="Tu sesion esta activa, pero no encontramos tu usuario en base de datos."
      />
    )
  }

  const portfolio = await getPortfolio(user.id)

  return (
    <>
      <PageHeader
        icon={UserCircle2}
        eyebrow="Perfil"
        title="Tu cuenta"
        description="Datos personales, liquidez disponible y preferencias de seguridad."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Detalles */}
          <section
            aria-labelledby="details-title"
            className="rounded-xl border border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="details-title" className="text-sm font-semibold text-foreground">
                Información de contacto
              </h2>
              <span className="font-mono text-[11px] text-muted-foreground">
                Verificada
              </span>
            </div>
            <ProfileInlineDetails
              name={user.name}
              phone={(user as any).phone}
              email={user.email}
              country={(user as any).country}
            />
          </section>

          {/* Preferencias */}
          <section
            aria-labelledby="prefs-title"
            className="rounded-xl border border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="prefs-title" className="text-sm font-semibold text-foreground">
                Preferencias y seguridad
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {PREFERENCES.map((p) => {
                const Icon = p.icon
                return (
                  <li
                    key={p.title}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-sm font-semibold text-foreground">
                          {p.title}
                        </div>
                        <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                        p.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {p.enabled ? "Activo" : "Configurar"}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-6" aria-label="Perfil">
          <ProfileCard
            name={user.name}
            baseCurrency={user.baseCurrency}
            assetsCount={portfolio.assets.length}
            gainLossPercent={portfolio.gainLossPercent}
          />
        </aside>
      </div>
    </>
  )
}
