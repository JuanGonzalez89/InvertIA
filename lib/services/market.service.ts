import { marketCache } from "@/lib/cache/market-cache";
import { QUOTE_FIELDS, toBCBASymbol, yahooFinance } from "@/lib/yahoo";

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

export async function getMarketQuotes(
  tickers: readonly string[] = DEFAULT_TRACKED_TICKERS
): Promise<MarketQuoteSnapshot[]> {
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const symbol = toBCBASymbol(ticker);
      const cacheKey = `quote:${symbol}`;
      const cached = marketCache.get<MarketQuoteSnapshot>(cacheKey);

      if (cached) {
        return cached;
      }

      try {
        const quote = await yahooFinance.quote(symbol, { fields: QUOTE_FIELDS });

        if (!quote.regularMarketPrice) {
          return null;
        }

        const normalized: MarketQuoteSnapshot = {
          ticker,
          name: quote.shortName ?? ticker,
          price: quote.regularMarketPrice,
          currency: quote.currency ?? "ARS",
          changePercent: quote.regularMarketChangePercent ?? 0,
        };

        marketCache.set(cacheKey, normalized, 180);
        return normalized;
      } catch {
        return null;
      }
    })
  );

  return results.filter((item): item is MarketQuoteSnapshot => item !== null);
}

export async function getTopMovers(limit = 4): Promise<MarketQuoteSnapshot[]> {
  const quotes = await getMarketQuotes();

  return quotes
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, limit);
}
