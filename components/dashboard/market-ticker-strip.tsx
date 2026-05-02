import { getMarketQuotes } from "@/lib/services/market.service"
import { formatARS, formatPercent } from "@/lib/utils"

export async function MarketTickerStrip() {
  const quotes = await getMarketQuotes(["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "MELI", "GGAL", "VIST"])

  if (quotes.length === 0) {
    return null
  }

  const items = [...quotes, ...quotes].map((quote, index) => {
    const changePercent = Number.isFinite(quote.changePercent)
      ? quote.changePercent
      : 0
    return {
      key: `${quote.ticker}-${index}`,
      ticker: quote.ticker,
      price: formatARS(quote.price),
      positive: changePercent >= 0,
      delta: `${changePercent >= 0 ? "+" : ""}${formatPercent(changePercent)}`,
    }
  })

  return (
    <section aria-label="Índices y cotizaciones en vivo" className="rounded-xl border border-border bg-card p-3">
      <div className="ticker-marquee overflow-hidden">
        <div className="ticker-marquee-track flex min-w-max gap-3">
          {items.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] ${
                item.positive
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  : "border-red-500/20 bg-red-500/10 text-red-500"
              }`}
            >
              <span className="font-semibold">{item.ticker}</span>
              <span>{item.price}</span>
              <span>{item.delta}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
