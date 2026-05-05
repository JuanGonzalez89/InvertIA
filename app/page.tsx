import Link from "next/link"
import { SignedIn, SignedOut } from "@/components/auth/signed-state"
import { LandingPage } from "@/components/landing/landing-page"
import { HomePreviews } from "@/components/dashboard/home-previews"
import { SectionShortcuts } from "@/components/dashboard/section-shortcuts"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { DataErrorState } from "@/components/dashboard/data-error-state"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getBCBAMarketStatus } from "@/lib/market/market-status"
import { getTopMovers } from "@/lib/services/market.service"
import { getPortfolio, getRecentOrders } from "@/lib/services/portfolio.service"
import { AutoRefresh } from "@/components/dashboard/auto-refresh"

export const dynamic = "force-dynamic"

export default async function Page() {
  const marketStatus = getBCBAMarketStatus()

  let user = null
  let portfolio = null
  let recentOrders: Awaited<ReturnType<typeof getRecentOrders>> = []
  let topMovers: Awaited<ReturnType<typeof getTopMovers>> = []
  let dataError = false

  try {
    user = await getCurrentUser()

    if (user) {
      ;[portfolio, recentOrders, topMovers] = await Promise.all([
        getPortfolio(user.id),
        getRecentOrders(user.id, 3),
        getTopMovers(4),
      ])
    }
  } catch {
    dataError = true
  }

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        {dataError ? (
          <DataErrorState
            title="No pudimos cargar tu dashboard"
            description="Tu sesion esta activa, pero fallo la sincronizacion con la base de datos. Revisa DATABASE_URL en Vercel y volve a intentar."
          />
        ) : user && !((user as any).phone) ? (
          <section className="rounded-xl border border-border bg-card p-6 sm:p-10">
            <h2 className="text-lg font-semibold">Completa tu perfil</h2>
            <p className="mt-2 text-sm text-muted-foreground">Para continuar, completá tu teléfono.</p>
            <div className="mt-4">
              <a href="/perfil/editar" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Completar perfil</a>
            </div>
          </section>
        ) : user && portfolio ? (
          <>
            <AutoRefresh enabled={marketStatus.isOpen} />
            <WelcomeBanner
              userName={user.name}
              marketOpen={marketStatus.isOpen}
              marketStatusLabel={marketStatus.label}
            />
            <SummaryCards portfolio={portfolio} />
            <SectionShortcuts />
            <HomePreviews
              topHoldings={portfolio.assets}
              topMovers={topMovers}
              latestOrders={recentOrders}
            />
          </>
        ) : null}
      </SignedIn>
    </>
  )
}