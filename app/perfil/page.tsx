import {
  UserCircle2,
} from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { DataErrorState } from "@/components/dashboard/data-error-state"
import { ProfileInlineDetails } from "@/components/dashboard/profile-inline-details"
import { ProfileSettingsList } from "@/components/dashboard/profile-settings-list"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getPortfolio } from "@/lib/services/portfolio.service"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

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
  const twoFactorEnabled = Boolean((user as any).twoFactorEnabled)

  return (
    <>
      <PageHeader
        icon={UserCircle2}
        eyebrow="Perfil"
        title="Tu cuenta"
        description="Datos personales y preferencias de seguridad."
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
            <ProfileSettingsList twoFactorEnabled={twoFactorEnabled} />
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
