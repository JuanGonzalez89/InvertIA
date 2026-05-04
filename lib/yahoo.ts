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
 * - Si ya tiene sufijo (.BA), devolverlo tal cual.
 * - Si es YPF, devolver YPFD.BA (Acción local).
 * - Si es un ticker internacional conocido (AAPL, MSFT), agregar .BA para buscar el CEDEAR.
 * - Si es una acción líder de Merval (GGAL, PAMP), se mantienen igual (Yahoo las tiene sin sufijo o con .BA).
 */
export function toBCBASymbol(ticker: string): string {
  const cleaned = ticker.trim().toUpperCase();
  
  if (cleaned.includes(".")) return cleaned;

  // Casos especiales de mapeo directo
  const specialMappings: Record<string, string> = {
    "YPF": "YPFD.BA",
    "GGAL": "GGAL.BA",
    "PAMP": "PAMP.BA",
    "EDN": "EDN.BA",
    "ALUA": "ALUA.BA",
    "TXAR": "TXAR.BA",
    "BMA": "BMA.BA",
    "CEPU": "CEPU.BA",
    "LOMA": "LOMA.BA",
    "CRES": "CRES.BA",
    "COME": "COME.BA",
    "METR": "METR.BA",
    "SUPV": "SUPV.BA",
    "TGSU2": "TGSU2.BA",
    "TGNO4": "TGNO4.BA",
  };

  if (specialMappings[cleaned]) return specialMappings[cleaned];
  
  // Bonos argentinos
  const bonds = /^(GD|AY|TX|JX|D|AL|PR|VD)\d{2}[A-Z]?$/;
  if (bonds.test(cleaned)) return cleaned;
  
  // Tickers internacionales (asumimos que el usuario quiere el CEDEAR si no puso punto)
  const international = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "NFLX",
    "AMD", "INTC", "IBM", "ORACLE", "SAP", "ADBE", "CRM", "PYPL", "MELI"
  ];
  
  if (international.includes(cleaned)) {
    return `${cleaned}.BA`;
  }
  
  return cleaned;
}
