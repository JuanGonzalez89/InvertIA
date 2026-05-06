import { NextResponse } from "next/server"

import { getMarketQuote } from "@/lib/services/market.service"
import { toBCBASymbol } from "@/lib/yahoo"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")?.trim().toUpperCase()
  const market = searchParams.get("market")?.trim().toLowerCase()

  if (!ticker) {
    return NextResponse.json({ error: "Ticker requerido" }, { status: 400 })
  }

  try {
    const resolvedTicker = market === "global"
      ? ticker.replace(/\.BA$/i, "")
      : toBCBASymbol(ticker)

    const quote = await getMarketQuote(resolvedTicker)

    if (!quote) {
      return NextResponse.json({ error: "No se encontró cotización" }, { status: 404 })
    }

    return NextResponse.json({
      ticker: quote.ticker,
      name: quote.name,
      price: quote.price,
      currency: quote.currency,
      changePercent: quote.changePercent,
      market: quote.currency === "ARS" ? "local" : "global",
    })
  } catch (error) {
    console.error("[MarketQuote] Failed to resolve quote", error)
    return NextResponse.json({ error: "No se pudo obtener la cotización" }, { status: 500 })
  }
}