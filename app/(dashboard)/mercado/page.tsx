import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { MarketStocks } from "@/components/dashboard/market-stocks"
import { MarketTickerStrip } from "@/components/dashboard/market-ticker-strip"
import { Sparkline } from "@/components/dashboard/sparkline"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getBCBAMarketStatus } from "@/lib/market/market-status"
import { getMarketQuotes } from "@/lib/services/market.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

export const dynamic = "force-dynamic"

function buildSparkline(price: number, changePercent: number) {
  const previous = changePercent === -100 ? price : price / (1 + changePercent / 100)

  return Array.from({ length: 8 }, (_, index) => {
    const progress = index / 7
    return previous + (price - previous) * progress
  })
}

const MARKET_FAQ: Array<{ key: string; title: string; body: string }> = [
  {
    key: "cedear",
    title: "¿Qué es un CEDEAR?",
    body: "Es un certificado que replica una acción del exterior y se negocia en Argentina en pesos. Su precio suele reflejar el subyacente en USD + el tipo de cambio implícito.",
  },
  {
    key: "ba",
    title: "¿Qué significa el sufijo .BA?",
    body: "Indica que el símbolo corresponde al mercado local (BCBA) en Yahoo Finance. En la app, se usa para identificar cotizaciones en ARS.",
  },
  {
    key: "ars",
    title: "¿Por qué acá dice “En pesos · BCBA”?",
    body: "Este panel está pensado para ver instrumentos que cotizan en Argentina en ARS. Si un ticket no tiene cotización en pesos, no se muestra.",
  },
  {
    key: "variation",
    title: "¿Qué es la variación (%) de hoy?",
    body: "Es el cambio porcentual respecto del cierre anterior disponible. Puede variar según el horario de mercado y la disponibilidad de datos.",
  },
  {
    key: "sparkline",
    title: "¿Qué representa la mini curva (sparkline)?",
    body: "Es una visualización rápida del movimiento reciente del precio. Sirve para comparar tendencias de un vistazo.",
  },
  {
    key: "ticket-not-found",
    title: "¿Qué significa “Ticket no encontrado”?",
    body: "Que no hay coincidencias en la lista local ni una cotización válida en ARS para ese símbolo. Revisá el ticker o probá con el sufijo correcto.",
  },
  {
    key: "local-vs-global",
    title: "¿Qué es “Local” vs “Global” en el buscador?",
    body: "Local prioriza símbolos del mercado argentino; Global busca el símbolo internacional. Es útil para evitar confundir un CEDEAR con su subyacente.",
  },
  {
    key: "underlying",
    title: "¿Qué es el “subyacente”?",
    body: "Es la acción original en el exterior que un CEDEAR replica (por ejemplo, AAPL). En el detalle del activo podés ver esa relación.",
  },
  {
    key: "ratio",
    title: "¿Qué es el “ratio” de un CEDEAR?",
    body: "Es la equivalencia entre CEDEAR y acción subyacente (por ejemplo 10:1). Se usa para estimar el tipo de cambio implícito.",
  },
  {
    key: "ccl",
    title: "¿Qué es el CCL implícito?",
    body: "Es una estimación del tipo de cambio que “explica” el precio en pesos a partir del subyacente en USD y el ratio. Es una referencia, no una cotización oficial.",
  },
]

export default async function MercadoPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>
}) {
  const marketStatus = getBCBAMarketStatus()
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams?.query ?? ""
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
      <PageHeader icon={Activity} eyebrow="Análisis" title="Mercado" description={marketStatus.label} />

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
                    indice.positive ? "bg-primary/10 text-primary" : "bg-destructive/15 text-destructive"
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <MarketStocks query={query} />

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm">¿Cómo usar Mercado?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Explorá CEDEARs y acciones locales en pesos. Usá el buscador para encontrar un ticker y hacé click en una tarjeta para ver el detalle.
            </p>

            <Accordion type="single" collapsible className="w-full">
              {MARKET_FAQ.map((item) => (
                <AccordionItem key={item.key} value={item.key}>
                  <AccordionTrigger className="font-mono text-[11px] uppercase tracking-wider text-foreground hover:no-underline">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.body}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
