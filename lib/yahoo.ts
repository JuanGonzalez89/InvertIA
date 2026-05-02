import YahooFinance from "yahoo-finance2";

export const yahooFinance = new YahooFinance();

// Campos mínimos: menos tokens al LLM, respuesta más rápida
export const QUOTE_FIELDS = [
  "regularMarketPrice",
  "currency",
  "regularMarketChangePercent",
  "regularMarketVolume",
  "shortName",
];

// Parser silencioso: el LLM manda "AAPL", nosotros buscamos "AAPL.BA"
// Si el ticker ya tiene sufijo (ej: "GGAL.BA"), lo respeta tal cual
export function toBCBASymbol(ticker: string): string {
  if (ticker.includes(".")) return ticker.toUpperCase();
  return `${ticker.toUpperCase()}.BA`;
}
