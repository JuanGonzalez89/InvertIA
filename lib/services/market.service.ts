import { marketCache } from "@/lib/cache/market-cache";
import { QUOTE_FIELDS, yahooFinance } from "@/lib/yahoo";

export interface MarketQuoteSnapshot {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  changePercent: number;
}

const DEFAULT_TRACKED_TICKERS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "MELI",
  "VIST",
  "GGAL",
] as const;

async function fetchQuoteForSymbol(symbol: string) {
  const isArgentinian = symbol.endsWith(".BA");
  const candidates = Array.from(
    new Set(
      isArgentinian
        ? [symbol.toUpperCase()]
        : [
            symbol.toUpperCase(),
            symbol.includes(".") ? symbol.toUpperCase() : `${symbol.toUpperCase()}.BA`,
          ]
    )
  );

  for (const candidate of candidates) {
    const cacheKey = `quote:${candidate}`;
    const cached = marketCache.get<MarketQuoteSnapshot>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const quote = await yahooFinance.quote(candidate, { fields: QUOTE_FIELDS });

      if (!quote.regularMarketPrice) {
        continue;
      }

      const normalized: MarketQuoteSnapshot = {
        ticker: symbol.toUpperCase(),
        name: quote.shortName ?? symbol.toUpperCase(),
        price: quote.regularMarketPrice,
        currency: candidate.endsWith(".BA") ? "ARS" : quote.currency ?? "ARS",
        changePercent: quote.regularMarketChangePercent ?? 0,
      };

      marketCache.set(cacheKey, normalized, 180);
      return normalized;
    } catch {
      continue;
    }
  }

  return null;
}

export async function getMarketQuotes(
  tickers: readonly string[] = DEFAULT_TRACKED_TICKERS
): Promise<MarketQuoteSnapshot[]> {
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      return fetchQuoteForSymbol(ticker);
    })
  );

  return results.filter((item): item is MarketQuoteSnapshot => item !== null);
}

export async function getMarketQuote(ticker: string): Promise<MarketQuoteSnapshot | null> {
  return fetchQuoteForSymbol(ticker);
}

export async function getTopMovers(limit = 4): Promise<MarketQuoteSnapshot[]> {
  const quotes = await getMarketQuotes();

  return quotes
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, limit);
}
