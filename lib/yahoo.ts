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

/**
 * Convierte un ticker base a su formato correcto para Yahoo Finance.
 * Reglas:
 * - Si ya tiene sufijo (.BA, .BA), devolverlo tal cual
 * - Si es un ticker internacional (AAPL, MSFT, etc.), agregar .BA (CEDEAR)
 * - Si es una acción BCBA local (GGAL, VIST, YPF), NO agregar .BA
 * - Si es un bono (GD30D, AY24D), NO agregar .BA
 */
export function toBCBASymbol(ticker: string): string {
  const cleaned = ticker.trim().toUpperCase();
  
  // Si ya tiene sufijo, devolverlo
  if (cleaned.includes(".")) {
    return cleaned;
  }
  
  // Tickers locales BCBA que NO llevan .BA
  const localBCBA = [
    "GGAL", "VIST", "YPF", "BMA", "SUPV", "TRAN", "AUSO", "TYC",
    "MELI", "LOMA", "CRES", "CONL", "COME", "VALO", "ALUA", "CEPU",
  ];
  
  // Bonos argentinos
  const bonds = /^(GD|AY|TX|JX|D|AL|PR|VD)\d{2}[A-Z]?$/;
  
  // Tickers internacionales que SÍ llevan .BA
  const international = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "NFLX",
    "AMD", "INTC", "IBM", "ORACLE", "SAP", "ADBE", "CRM", "PYPL",
  ];
  
  // Lógica de conversión
  if (localBCBA.includes(cleaned)) {
    return cleaned; // GGAL → GGAL
  }
  
  if (bonds.test(cleaned)) {
    return cleaned; // GD30D → GD30D
  }
  
  if (international.includes(cleaned)) {
    return `${cleaned}.BA`; // AAPL → AAPL.BA
  }
  
  // Por defecto: no agregar nada (podría ser un ticker desconocido)
  return cleaned;
}
