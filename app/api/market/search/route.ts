import { yahooFinance } from "@/lib/yahoo";
import { getMarketQuote } from "@/lib/services/market.service";

type MarketSearchResult = {
  ticker: string;
  name: string;
  exchange?: string | null;
  type?: string | null;
  market?: "local" | "global";
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapSearchResult(item: any): MarketSearchResult | null {
  const ticker = normalizeText(item?.symbol ?? item?.ticker ?? item?.quoteType);
  const name = normalizeText(item?.shortname ?? item?.shortName ?? item?.longname ?? item?.longName ?? item?.name);

  if (!ticker) {
    return null;
  }

  return {
    ticker,
    name: name || ticker,
    exchange: normalizeText(item?.exchDisp ?? item?.exchangeDisp ?? item?.exchange) || null,
    type: normalizeText(item?.typeDisp ?? item?.quoteType) || null,
  };
}

function classifyMarket(ticker: string): "local" | "global" {
  return ticker.toUpperCase().endsWith(".BA") ? "local" : "global";
}

function dedupeByTicker(items: MarketSearchResult[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.ticker.toUpperCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const scope = (searchParams.get("scope")?.trim().toLowerCase() || "both") as "local" | "global" | "both";

  if (!query) {
    return Response.json({ results: [] });
  }

  try {
    const results = await (yahooFinance as any).search(query);
    const rawItems = Array.isArray(results?.items)
      ? results.items
      : Array.isArray(results?.quotes)
        ? results.quotes
        : [];

    const mapped = rawItems
      .map(mapSearchResult)
      .filter((item): item is MarketSearchResult => item !== null)
      .map((item) => ({ ...item, market: classifyMarket(item.ticker) }))
      .filter((item) => item.ticker.toLowerCase().includes(query.toLowerCase()) || item.name.toLowerCase().includes(query.toLowerCase()));

    const exactLocalTicker = query.includes(".") ? query.toUpperCase() : `${query.toUpperCase()}.BA`;
    const exactGlobalTicker = query.replace(/\.BA$/i, "").toUpperCase();

    const exactLocal = await getMarketQuote(exactLocalTicker);
    const exactGlobal = await getMarketQuote(exactGlobalTicker);

    const exactResults: MarketSearchResult[] = [];

    if (exactLocal?.ticker) {
      exactResults.push({
        ticker: exactLocal.ticker,
        name: exactLocal.name,
        market: "local",
      });
    }

    if (exactGlobal?.ticker && exactGlobal.ticker.toUpperCase() !== exactLocalTicker.toUpperCase()) {
      exactResults.push({
        ticker: exactGlobal.ticker,
        name: exactGlobal.name,
        market: "global",
      });
    }

    const combined = dedupeByTicker([...exactResults, ...mapped]);

    const resultsByScope = combined.filter((item) => {
      if (scope === "both") return true;
      return item.market === scope;
    }).slice(0, 8);

    return Response.json({ results: resultsByScope });
  } catch (error) {
    console.error("[MarketSearch] Yahoo search failed for", query, error);
    return Response.json({ results: [] }, { status: 200 });
  }
}