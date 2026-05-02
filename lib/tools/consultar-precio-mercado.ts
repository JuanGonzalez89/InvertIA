import { tool } from "ai";
import { z } from "zod";
import { yahooFinance, toBCBASymbol, QUOTE_FIELDS } from "@/lib/yahoo";
import { marketCache } from "@/lib/cache/market-cache";

type MarketQuote = {
  regularMarketPrice?: number;
  currency?: string;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  shortName?: string;
}

export const consultarPrecioMercado = tool({
  description:
    "Obtiene el precio de mercado actual de un activo en la Bolsa de Buenos Aires (BYMA/BCBA). Recibe el ticker base como 'AAPL', 'NVDA' o 'GGAL' y busca automáticamente el precio en pesos. Usala cuando necesites el precio actual de mercado.",
  inputSchema: z.object({
    ticker: z
      .string()
      .describe(
        "Símbolo del activo sin sufijo. Ejemplos: 'AAPL', 'NVDA', 'GGAL', 'MELI'"
      ),
  }),
  execute: async ({ ticker }) => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!/^[A-Z0-9.]{1,12}$/.test(normalizedTicker)) {
      return {
        error: "Ticker invalido",
        sugerencia:
          "Usa un simbolo valido, por ejemplo 'AAPL', 'GGAL' o 'MELI'. Evita espacios y caracteres especiales.",
      };
    }

    const symbol = toBCBASymbol(normalizedTicker);
    console.log(`[Tool] consultarPrecioMercado → buscando ${symbol}`);

    // 1. Chequear caché primero
    const cached = marketCache.get<object>(symbol);
    if (cached) {
      console.log(`[Tool] consultarPrecioMercado → hit de caché para ${symbol}`);
      return cached;
    }

    // 2. Llamar a Yahoo con campos mínimos
    try {
      const quote = (await yahooFinance.quote(symbol, {
        fields: QUOTE_FIELDS,
      })) as MarketQuote;

      if (!quote.regularMarketPrice) {
        return {
          error: "Activo no encontrado en BCBA",
          sugerencia: `No encontré cotización para ${normalizedTicker} en la bolsa argentina. Verifica que el ticker sea correcto o prueba con el simbolo base sin sufijo .BA.`,
        };
      }

      const resultado = {
        ticker: symbol,
        tickerBase: normalizedTicker,
        precio: quote.regularMarketPrice,
        moneda: quote.currency ?? "ARS",
        variacionPorcentual: quote.regularMarketChangePercent?.toFixed(2),
        volumen: quote.regularMarketVolume,
        nombre: quote.shortName,
      };

      // 3. Guardar en caché por 5 minutos
      marketCache.set(symbol, resultado, 300);

      return resultado;
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("Too Many"));

      if (isRateLimit) {
        return {
          error: "Sistemas de cotización saturados",
          sugerencia:
            "Los servidores de datos del mercado están con mucho tráfico ahora mismo. Podés intentar en 5 minutos o consultar otra acción.",
        };
      }

      console.error(`[Tool] consultarPrecioMercado error para ${symbol}:`, error);
      return {
        error: "No se pudo obtener la cotización",
        sugerencia: "Hubo un error de conexión. Probá con otro ticker o intentá más tarde.",
      };
    }
  },
});