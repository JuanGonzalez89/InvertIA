import { BarChart3 } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { MarketStocks } from "@/components/dashboard/market-stocks"
import { MarketTickerStrip } from "@/components/dashboard/market-ticker-strip"
import { getBCBAMarketStatus } from "@/lib/market/market-status"

export default async function MercadoPage() {
  const marketStatus = getBCBAMarketStatus()

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        eyebrow="Mercados"
        title="Monitor en Tiempo Real"
        description="Seguí los principales índices y activos del mercado local e internacional."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${marketStatus.isOpen ? 'bg-primary terminal-pulse' : 'bg-muted'}`} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              BCBA: {marketStatus.label}
            </span>
          </div>
        }
      />

      <MarketTickerStrip />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <MarketStocks />
        </div>
        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Información</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Los precios de activos locales (BCBA) pueden tener un retraso de hasta 20 minutos. 
              Los índices internacionales se actualizan en tiempo real.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
