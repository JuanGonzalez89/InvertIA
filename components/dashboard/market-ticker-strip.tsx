import { getMarketQuotes } from "@/lib/services/market.service"

export async function MarketTickerStrip() {
  const quotes = await getMarketQuotes(["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "MELI", "GGAL", "VIST"])

  if (quotes.length === 0) {
    return null
  }

  const items = [...quotes, ...quotes].map((quote, index) => ({
    key: `${quote.ticker}-${index}`,
    ticker: quote.ticker,
    price: `${quote.currency} ${quote.price.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    positive: quote.changePercent >= 0,
    delta: `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`,
  }))

  return (
    <section aria-label="Índices y cotizaciones en vivo" className="rounded-xl border border-border bg-card p-3">
      <div className="ticker-marquee overflow-hidden">
        <div className="ticker-marquee-track flex min-w-max gap-3">
          {items.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] ${
                item.positive
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-destructive/20 bg-destructive/10 text-destructive"
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
