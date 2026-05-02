import {
  ArrowDownRight,
  ArrowUpRight,
  LineChart,
} from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { MarketStocks } from "@/components/dashboard/market-stocks"
import { MarketTickerStrip } from "@/components/dashboard/market-ticker-strip"
import { Sparkline } from "@/components/dashboard/sparkline"
import { getBCBAMarketStatus } from "@/lib/market/market-status"
import { getMarketQuotes } from "@/lib/services/market.service"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Activity } from "lucide-react"

export const dynamic = "force-dynamic"

const SECTORS = [
  { name: "Tecnología", delta: "+2,1%", positive: true },
  { name: "Energía", delta: "+1,8%", positive: true },
  { name: "Financieras", delta: "+0,9%", positive: true },
  { name: "Consumo", delta: "-0,3%", positive: false },
  { name: "Salud", delta: "+0,4%", positive: true },
  { name: "Industriales", delta: "-0,8%", positive: false },
]

function buildSparkline(price: number, changePercent: number) {
  const previous = changePercent === -100 ? price : price / (1 + changePercent / 100)

  return Array.from({ length: 8 }, (_, index) => {
    const progress = index / 7
    return previous + (price - previous) * progress
  })
}

export default async function MercadoPage({ searchParams }: { searchParams?: { query?: string } }) {
  const marketStatus = getBCBAMarketStatus()
  const query = searchParams?.query ?? ""
  const indexQuotes = await getMarketQuotes(["^GSPC", "^IXIC", "^DJI", "^MERV"])

  const INDICES = indexQuotes.map((quote) => ({
    name:
      quote.ticker === "^GSPC"
        ? "S&P 500"
        : quote.ticker === "^IXIC"
          ? "NASDAQ"
          : quote.ticker === "^DJI"
            ? "Dow Jones"
            : "MERVAL",
    value: quote.price.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    delta: `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`,
    positive: quote.changePercent >= 0,
    spark: buildSparkline(quote.price, quote.changePercent),
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <PageHeader
        icon={Activity}
        eyebrow="Análisis"
        title="Mercado"
        description={marketStatus.label}
      />
      <div className="border-y bg-background/50">
        <MarketTickerStrip />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {INDICES.map((indice) => (
          <Card key={indice.name}>
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {indice.name}
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
                    {indice.value}
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                    indice.positive
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {indice.positive ? (
                    <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5" aria-hidden />
                  )}
                  {indice.delta}
                </span>
              </div>
              <div className="mt-3 h-10">
                <Sparkline data={indice.spark} positive={indice.positive} className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <MarketStocks query={query} />
    </div>
  )
}
