import { db } from "@/lib/prisma";
import { QUOTE_FIELDS, toBCBASymbol, yahooFinance } from "@/lib/yahoo";
import { analyzeNews } from "./news-analyzer.service";

export type AssetDetailRange = "1D" | "1M" | "6M" | "1Y" | "5Y";

export type AssetDetailPoint = {
  date: string;
  close: number;
};

export type AssetDetailData = {
  requestedTicker: string;
  ticker: string;
  name: string;
  companyName: string;
  isCedear: boolean;
  currentPriceARS: number;
  dailyChangeARS: number;
  dailyChangePercent: number;
  volume: number | null;
  week52Low: number | null;
  week52High: number | null;
  underlyingTicker: string | null;
  underlyingPriceUSD: number | null;
  cedearRatio: number | null;
  cedearRatioSource: "db" | "fallback" | "missing";
  impliedCCL: number | null;
  about: string;
  news: Array<{
    title: string;
    link: string | null;
    source: string | null;
    publishedAt: string | null;
    summary?: string;
    impact?: "Bullish" | "Bearish" | "Neutral";
    impactReason?: string;
  }>;
  chartPoints: AssetDetailPoint[];
  chartLabel: string;
  lastUpdated: string;
};

type AssetRecord = {
  symbol: string;
  name: string;
  type: string;
  yahooSymbol: string | null;
  cedearRatio: string | null;
  underlyingSymbol: string | null;
  currency: string;
};

type RangeConfig = {
  label: string;
  periodDays: number;
  interval: "5m" | "1d" | "1wk" | "1mo";
};

const RANGE_CONFIG: Record<AssetDetailRange, RangeConfig> = {
  "1D": { label: "1 día", periodDays: 1, interval: "5m" },
  "1M": { label: "1 mes", periodDays: 31, interval: "1d" },
  "6M": { label: "6 meses", periodDays: 183, interval: "1d" },
  "1Y": { label: "1 año", periodDays: 365, interval: "1wk" },
  "5Y": { label: "5 años", periodDays: 365 * 5, interval: "1mo" },
};

const FALLBACK_CEDEAR_INFO: Record<string, { ratio: number; underlying: string }> = {
  "AAPL.BA": { ratio: 10, underlying: "AAPL" },
  "MSFT.BA": { ratio: 10, underlying: "MSFT" },
  "NVDA.BA": { ratio: 10, underlying: "NVDA" },
  "GOOGL.BA": { ratio: 10, underlying: "GOOGL" },
  "AMZN.BA": { ratio: 10, underlying: "AMZN" },
  "META.BA": { ratio: 10, underlying: "META" },
  "TSLA.BA": { ratio: 15, underlying: "TSLA" },
  "NFLX.BA": { ratio: 10, underlying: "NFLX" },
  "AMD.BA": { ratio: 10, underlying: "AMD" },
  "MELI.BA": { ratio: 60, underlying: "MELI" },
  "BABA.BA": { ratio: 9, underlying: "BABA" },
  "KO.BA": { ratio: 5, underlying: "KO" },
  "DIS.BA": { ratio: 4, underlying: "DIS" },
  "V.BA": { ratio: 10, underlying: "V" },
  "WMT.BA": { ratio: 6, underlying: "WMT" },
  "JPM.BA": { ratio: 5, underlying: "JPM" },
};

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseCedearRatio(rawRatio?: string | null): number | null {
  if (!rawRatio) return null;

  const cleaned = rawRatio.trim();
  const direct = Number(cleaned);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const ratioMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!ratioMatch) return null;

  const parsed = Number(ratioMatch[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildFallbackAbout(name: string, ticker: string, isCedear: boolean) {
  if (isCedear) {
    return `${name} cotiza en pesos como CEDEAR. El precio local depende del subyacente en USD y del tipo de cambio implícito.`;
  }

  return `${name} cotiza en el mercado local bajo el ticker ${ticker}. Su evolución suele responder a factores del mercado argentino y al sector al que pertenece.`;
}

async function resolveAssetRecord(ticker: string): Promise<AssetRecord | null> {
  const normalized = ticker.trim().toUpperCase();
  const alternate = normalized.endsWith(".BA") ? normalized.replace(/\.BA$/, "") : `${normalized}.BA`;

  return db.asset.findFirst({
    where: {
      OR: [
        { symbol: normalized },
        { symbol: alternate },
        { yahooSymbol: normalized },
        { yahooSymbol: alternate },
      ],
    },
  });
}

function resolvePreferredSymbol(ticker: string, market?: "local" | "global") {
  const normalized = ticker.trim().toUpperCase();

  if (normalized.includes(".")) {
    return normalized;
  }

  if (market === "global") {
    return normalized;
  }

  if (market === "local") {
    return toBCBASymbol(normalized);
  }

  return toBCBASymbol(normalized);
}

async function fetchMarketSnapshot(symbol: string) {
  try {
    const [quoteResult, chartResult] = await Promise.allSettled([
      yahooFinance.quote(symbol, { fields: QUOTE_FIELDS }),
      yahooFinance.chart(symbol, {
        period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        interval: "1d",
      }),
    ]);

    const quote = quoteResult.status === "fulfilled" ? quoteResult.value : null;
    const chart = chartResult.status === "fulfilled" ? chartResult.value : null;

    if (!quote && !chart) return null;

    const latestClose = chart?.quotes?.at(-1)?.close ?? null;
    const previousClose = chart?.meta?.previousClose ?? chart?.meta?.chartPreviousClose ?? latestClose;
    const currentPrice =
      safeNumber(quote?.regularMarketPrice) ??
      chart?.meta?.regularMarketPrice ??
      latestClose ??
      0;
    const dailyChangeARS = currentPrice - (previousClose ?? currentPrice);
    const dailyChangePercent = previousClose && previousClose !== 0
      ? (dailyChangeARS / previousClose) * 100
      : safeNumber(quote?.regularMarketChangePercent) ?? 0;

    return {
      currentPrice,
      dailyChangeARS,
      dailyChangePercent,
      volume: safeNumber(quote?.regularMarketVolume) ?? safeNumber(chart?.meta?.regularMarketVolume) ?? null,
      week52Low: safeNumber(chart?.meta?.fiftyTwoWeekLow) ?? null,
      week52High: safeNumber(chart?.meta?.fiftyTwoWeekHigh) ?? null,
      companyName: quote?.shortName ?? chart?.meta?.longName ?? chart?.meta?.shortName ?? symbol,
      chartMeta: chart?.meta,
    };
  } catch (error) {
    console.warn("[AssetDetail] market snapshot failed for", symbol, error);
    return null;
  }
}

async function fetchProfileText(symbol: string): Promise<string | null> {
  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ["summaryProfile", "assetProfile"],
    });

    return (
      (summary as any)?.summaryProfile?.longBusinessSummary ??
      (summary as any)?.assetProfile?.longBusinessSummary ??
      null
    );
  } catch (error) {
    console.warn("[AssetDetail] quoteSummary failed for", symbol, error);
    return null;
  }
}

async function fetchNews(symbol: string, companyName?: string) {
  try {
    let results = await (yahooFinance as any).search(symbol);
    let rawNews = (results && results.news) || (results && results.items) || [];

    // Fallback: Si no hay noticias por ticker, buscar por nombre de empresa (más amplio)
    if (rawNews.length === 0 && companyName) {
      console.log(`[AssetDetail] No news for ${symbol}, trying company name: ${companyName}`);
      results = await (yahooFinance as any).search(companyName);
      rawNews = (results && results.news) || (results && results.items) || [];
    }

    if (!Array.isArray(rawNews)) return [];

    return rawNews.slice(0, 6).map((n: any) => ({
      title: n.title ?? n.headline ?? String(n),
      link: n.link ?? n.url ?? null,
      source: n.source ?? n.publisher ?? null,
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime).toISOString()
        : n.pubDate
        ? new Date(n.pubDate).toISOString()
        : null,
    }));
  } catch (error) {
    console.error('[AssetDetail] fetchNews failed for', symbol, error);
    return [];
  }
}

function getRangeConfig(range: AssetDetailRange): RangeConfig {
  return RANGE_CONFIG[range] ?? RANGE_CONFIG["1M"];
}

function mapChartPoints(quotes: Array<{ date: Date; close: number | null }>): AssetDetailPoint[] {
  return quotes
    .filter((quote) => typeof quote.close === "number")
    .map((quote) => ({
      date: quote.date.toISOString(),
      close: quote.close as number,
    }));
}

const BOND_TICKER_REGEX = /^(GD|AY|TX|JX|D|AL|PR|VD)\d{2}[A-Z]?(\.BA)?$/;

function isBondSymbol(ticker: string, assetType?: string) {
  if (assetType?.toUpperCase() === "BOND") return true;
  return BOND_TICKER_REGEX.test(ticker.toUpperCase());
}

function buildSymbolCandidates(symbol: string) {
  const cleaned = symbol.trim().toUpperCase();
  const candidates = new Set<string>();

  if (cleaned) {
    candidates.add(cleaned);
    if (cleaned.endsWith(".BA")) {
      candidates.add(cleaned.replace(/\.BA$/, ""));
    } else {
      candidates.add(`${cleaned}.BA`);
    }
  }

  return Array.from(candidates);
}

async function fetchChartSafe(symbol: string, period1: Date, interval: RangeConfig["interval"]) {
  try {
    return await yahooFinance.chart(symbol, { period1, interval });
  } catch (error) {
    console.warn("[AssetDetail] chart failed for", symbol, error);
    return null;
  }
}

async function fetchChartWithFallback(symbols: string[], period1: Date, interval: RangeConfig["interval"]) {
  for (const symbol of symbols) {
    const chart = await fetchChartSafe(symbol, period1, interval);
    if (chart) return { symbol, chart };
  }

  return { symbol: symbols[0] ?? "", chart: null };
}

async function fetchMarketSnapshotWithFallback(symbols: string[]) {
  for (const symbol of symbols) {
    const snapshot = await fetchMarketSnapshot(symbol);
    if (snapshot) return { symbol, snapshot };
  }

  const fallbackSymbol = symbols[0] ?? "";
  return {
    symbol: fallbackSymbol,
    snapshot: {
      currentPrice: 0,
      dailyChangeARS: 0,
      dailyChangePercent: 0,
      volume: null,
      week52Low: null,
      week52High: null,
      companyName: fallbackSymbol || "N/A",
      chartMeta: null,
    },
  };
}

export async function getAssetDetailData(
  ticker: string,
  range: AssetDetailRange = "1M",
  market?: "local" | "global"
): Promise<AssetDetailData> {
  const requestedTicker = ticker.trim().toUpperCase();
  const asset = market
    ? await db.asset.findFirst({
        where: market === "global"
          ? {
              OR: [
                { symbol: requestedTicker },
                { yahooSymbol: requestedTicker },
              ],
            }
          : {
              OR: [
                { symbol: requestedTicker.endsWith(".BA") ? requestedTicker : `${requestedTicker}.BA` },
                { yahooSymbol: requestedTicker.endsWith(".BA") ? requestedTicker : `${requestedTicker}.BA` },
              ],
            },
      })
    : await resolveAssetRecord(requestedTicker);

  const cedearSymbol = market === "global"
    ? requestedTicker
    : asset?.yahooSymbol ?? resolvePreferredSymbol(requestedTicker, market);
  const isCedear = market === "local"
    ? true
    : market === "global"
      ? false
      : asset?.type === "CEDEAR" || requestedTicker.endsWith(".BA");
  const fallbackInfo = FALLBACK_CEDEAR_INFO[cedearSymbol] ?? FALLBACK_CEDEAR_INFO[requestedTicker];

  const underlyingTicker =
    asset?.underlyingSymbol?.toUpperCase() ??
    (isCedear ? fallbackInfo?.underlying ?? requestedTicker.replace(/\.BA$/, "") : null);

  const cedearRatioDb = parseCedearRatio(asset?.cedearRatio ?? null);
  const cedearRatio = cedearRatioDb ?? fallbackInfo?.ratio ?? null;
  const cedearRatioSource: AssetDetailData["cedearRatioSource"] =
    cedearRatioDb ? "db" : cedearRatio ? "fallback" : "missing";

  const rangeConfig = getRangeConfig(range);
  const period1 = new Date(Date.now() - rangeConfig.periodDays * 24 * 60 * 60 * 1000);

  const symbolCandidates = buildSymbolCandidates(cedearSymbol);
  const shouldFetchProfile = !isBondSymbol(requestedTicker, asset?.type);

  const [snapshotResult, chartResult, underlyingSnapshot, profileText] = await Promise.all([
    fetchMarketSnapshotWithFallback(symbolCandidates),
    fetchChartWithFallback(symbolCandidates, period1, rangeConfig.interval),
    underlyingTicker ? fetchMarketSnapshot(underlyingTicker) : Promise.resolve(null),
    shouldFetchProfile ? fetchProfileText(underlyingTicker ?? cedearSymbol) : Promise.resolve(null),
  ]);

  const cedearSnapshot = snapshotResult.snapshot;
  const cedearHistory = chartResult.chart;
  const companyName = asset?.name ?? cedearSnapshot.companyName ?? requestedTicker;

  // Fetch news and analyze them with AI
  const rawNews = shouldFetchProfile ? await fetchNews(underlyingTicker ?? cedearSymbol, companyName) : [];
  const news = rawNews.length > 0 ? await analyzeNews(requestedTicker, rawNews) : [];

  const chartPoints = mapChartPoints(cedearHistory?.quotes ?? []);
  const currentPriceARS = cedearSnapshot.currentPrice;
  const underlyingPriceUSD = underlyingSnapshot?.currentPrice ?? null;
  const impliedCCL = cedearRatio && underlyingPriceUSD
    ? (currentPriceARS * cedearRatio) / underlyingPriceUSD
    : null;

  const about = profileText ?? buildFallbackAbout(companyName, cedearSymbol, isCedear);

  return {
    requestedTicker,
    ticker: cedearSymbol,
    name: asset?.name ?? cedearSnapshot.companyName,
    companyName,
    isCedear,
    currentPriceARS,
    dailyChangeARS: cedearSnapshot.dailyChangeARS,
    dailyChangePercent: cedearSnapshot.dailyChangePercent,
    volume: cedearSnapshot.volume,
    week52Low: cedearSnapshot.week52Low,
    week52High: cedearSnapshot.week52High,
    underlyingTicker,
    underlyingPriceUSD,
    cedearRatio,
    cedearRatioSource,
    impliedCCL,
    about,
    news,
    chartPoints,
    chartLabel: rangeConfig.label,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getAssetPerformanceSeries(
  ticker: string,
  range: AssetDetailRange = "1Y",
  market?: "local" | "global"
) {
  const requestedTicker = ticker.trim().toUpperCase();
  const symbol = market === "global"
    ? requestedTicker
    : resolvePreferredSymbol(requestedTicker, market);
  const rangeConfig = getRangeConfig(range);
  const period1 = new Date(Date.now() - rangeConfig.periodDays * 24 * 60 * 60 * 1000);
  const candidates = buildSymbolCandidates(symbol);
  const chartResult = await fetchChartWithFallback(candidates, period1, rangeConfig.interval);
  const chartPoints = mapChartPoints(chartResult.chart?.quotes ?? []);

  return {
    ticker: chartResult.symbol || symbol,
    chartPoints,
    chartLabel: rangeConfig.label,
    lastUpdated: new Date().toISOString(),
  };
}
