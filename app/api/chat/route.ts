import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPortfolio } from "@/lib/services/portfolio.service";
import { formatARS, formatPercent } from "@/lib/utils";
import { QUOTE_FIELDS, toBCBASymbol, yahooFinance } from "@/lib/yahoo";
import { z } from "zod";
import { consultarPrecioMercado } from "@/lib/tools/consultar-precio-mercado";
import { createConsultarMiCartera } from "@/lib/tools/consultar-mi-cartera";
import { calcularMetricas } from "@/lib/tools/calcular-metricas";
import { explicarDecision } from "@/lib/tools/explicar-decision";

type FreshMarketQuote = {
  ticker: string;
  price: number;
  changePercent: number;
  currency: string;
  name: string;
};

function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No se encontró GROQ_API_KEY en las variables de entorno.");
  return key;
}
// ──────────────────────────────────────────────────────────────────────────────

export const maxDuration = 120;

// ─── Rate Limiter (app-side, muy permisivo — el límite real es de Gemini) ─────
// 60 req/min por usuario → solo para prevenir abuso, no para throttling normal
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetIn: entry.resetAt - now };
}
// ──────────────────────────────────────────────────────────────────────────────

function extractRelevantTickers(messages: unknown[]): string[] {
  const text = messages
    .flatMap((message: any) => {
      if (typeof message?.content === "string") return message.content;
      if (Array.isArray(message?.parts)) {
        return message.parts
          .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
          .map((part: any) => part.text)
          .join(" ");
      }
      return "";
    })
    .join(" ")
    .toUpperCase();

  const aliases: Record<string, string> = {
    "VISTA ENERGY": "VIST",
    "GRUPO GALICIA": "GGAL",
    "GALICIA": "GGAL",
    "MERCADO LIBRE": "MELI",
    "NVIDIA": "NVDA",
    "APPLE": "AAPL",
    "MICROSOFT": "MSFT",
    "AMAZON": "AMZN",
    "GOOGLE": "GOOGL",
    "TESLA": "TSLA",
    "META": "META",
  };

  const found = new Set<string>();

  for (const [label, ticker] of Object.entries(aliases)) {
    if (text.includes(label)) {
      found.add(ticker);
    }
  }

  const regexMatches = text.match(/\b[A-Z]{2,6}(?:\.[A-Z]{2})?\b/g) ?? [];
  for (const match of regexMatches) {
    found.add(match);
  }

  return Array.from(found).slice(0, 8);
}

function getLatestUserText(messages: unknown[]): string {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message: any = messages[index];
    const role = message?.role ?? message?.parts?.[0]?.role;

    if (role !== "user") {
      continue;
    }

    if (typeof message?.content === "string") {
      return message.content.trim();
    }

    if (Array.isArray(message?.parts)) {
      const text = message.parts
        .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
        .map((part: any) => part.text)
        .join(" ")
        .trim();

      if (text) {
        return text;
      }
    }
  }

  return "";
}

function shouldBypassTools(latestUserText: string): boolean {
  const normalized = latestUserText.toLowerCase();

  if (!normalized) {
    return false;
  }

  const identityOrHelpQuery = /(quien sos|quién sos|qu[eé] funcionalidades tienes|que haces|qué haces|que puedes hacer|qué puedes hacer|funcionalidades|ayuda|help|about you|quien eres|quién eres)/i.test(
    normalized
  );

  if (identityOrHelpQuery) {
    return true;
  }

  const greetingStart = /^(hola|buenas|hey|hello|hi|saludos)\b/i.test(normalized);

  if (!greetingStart) {
    return false;
  }

  const hasFinanceIntent = /(\b[a-z]{2,6}(?:\.[a-z]{2})?\b|cedear|cedears|acción|acciones|bono|bonos|cartera|mercado|precio|rendimiento|comparar|comparación|historial|noticias|analiz|gráfico|grafico)/i.test(
    normalized
  );

  return !hasFinanceIntent;
}

function isFinancialIntent(latestUserText: string): boolean {
  const normalized = latestUserText.toLowerCase();

  if (!normalized) {
    return false;
  }

  return /\b(comparar|comparación|comparacion|rendimiento|historial|histórico|historico|noticias|analiz|analizar|análisis|analisis|precio|cotiz|cotización|cotizacion|cartera|mercado|bono|bonos|cedear|cedears|acción|acciones|portfolio|inversión|inversion|compra|venta|ganancia|pérdida|perdida|merval|dow jones|nasdaq|s&p|sp500)\b/i.test(
    normalized
  ) || /\b[A-Z]{2,6}(?:\.[A-Z]{2})?\b/.test(latestUserText);
}

async function getFreshMarketQuote(ticker: string): Promise<FreshMarketQuote | null> {
  const symbol = toBCBASymbol(ticker);

  try {
    const quote = await yahooFinance.quote(symbol, { fields: QUOTE_FIELDS });

    if (!quote || typeof quote.regularMarketPrice !== "number") {
      return null;
    }

    return {
      ticker: symbol,
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent ?? 0,
      currency: symbol.endsWith(".BA") ? "ARS" : quote.currency ?? "ARS",
      name: quote.shortName ?? symbol,
    };
  } catch (error) {
    console.error("[Chat API] Yahoo quote failed for", symbol, error);
    return null;
  }
}

function formatMarketSnapshot(quotes: FreshMarketQuote[]): string {
  if (quotes.length === 0) return "";

  return quotes
    .map((quote) => {
      const sign = quote.changePercent > 0 ? "+" : "";
      return `${quote.ticker} | ${quote.name} | ${formatARS(quote.price)} | ${sign}${quote.changePercent.toFixed(2)}% | ${quote.currency}`;
    })
    .join("\n");
}

export async function POST(req: Request) {
  let latestUserTextForFallback = "";

  try {
    const isLocalTest = req.headers.get("x-test-bypass") === "local-dev-only";
    const user = isLocalTest
      ? { id: "cmoqcatvf000004kwdkucu6q1", name: "Usuario InvertIA" }
      : await getCurrentUser();
    if (!user) {
      return new Response("No autorizado", { status: 401 });
    }

    const rl = checkRateLimit(user.id);
    if (!rl.allowed) {
      const secsLeft = Math.ceil(rl.resetIn / 1000);
      return new Response(
        `Límite alcanzado. Podés volver a preguntar en ${secsLeft} segundos.`,
        {
          status: 429,
          headers: { "Retry-After": String(secsLeft) },
        }
      );
    }

    const body = await req.json();
    let { messages, id: chatId } = body;
    const portfolioStatusHint = body.portfolio_status;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("El cuerpo de la solicitud no contiene mensajes válidos.", { status: 400 });
    }

    console.log(
      "[Chat API] provider=groq model=llama-3.3-70b-versatile chatId=%s msgs=%d status=%s rl_rem=%d",
      chatId, messages.length, portfolioStatusHint ?? "normal", rl.remaining
    );

    let portfolioContext = "";
    let marketContext = "";
    let portfolioTickers: string[] = [];
    if (portfolioStatusHint === "cached_unchanged") {
      portfolioContext = `[CARTERA] Sin cambios desde ultimo msg.`;
    } else {
      try {
        const portfolio = await getPortfolio(user.id);
        if (portfolio && portfolio.assets.length > 0) {
          portfolioTickers = portfolio.assets.map((asset) => asset.ticker);
          const assetsDescription = portfolio.assets
            .map((asset) => {
              const gainPercentAsset = asset.totalGainPercent ?? 0;
              const dailyChange = asset.dailyChangePercent ?? 0;
              const dailyLabel = dailyChange > 0 ? "📈" : dailyChange < 0 ? "📉" : "➡️";

              return `${asset.ticker}|${asset.quantity}un|${formatARS(asset.currentPrice)}|${gainPercentAsset > 0 ? "+" : ""}${gainPercentAsset.toFixed(1)}%|${dailyLabel}${dailyChange.toFixed(2)}%`;
            })
            .join("\n");

          const totalGainPercent = portfolio.gainLossPercent ?? 0;
          portfolioContext = `CARTERA:
Ticker|Cant|Precio|Ganancia%|Var24h%
${assetsDescription}
TOTAL: ${formatARS(portfolio.totalCurrentValue)} | Inv: ${formatARS(portfolio.totalInvested)} | P&L: ${formatARS(portfolio.totalGainLoss)} (${formatPercent(totalGainPercent)})`;
        }
      } catch (err) {
        console.error("Error retrieving portfolio for RAG:", err);
        portfolioContext = "[CARTERA] Error al cargar datos.";
      }
    }

    const SLIDING_WINDOW = 6;
    const windowedMessages = messages.slice(-SLIDING_WINDOW);
    const latestUserText = getLatestUserText(windowedMessages);
    latestUserTextForFallback = latestUserText;
    const bypassTools = shouldBypassTools(latestUserText);
    const financialIntent = isFinancialIntent(latestUserText);

    const groq = createGroq({ apiKey: getGroqApiKey() });

    if (bypassTools) {
      const smallTalkPrompt = `Sos InvertIA, un asistente cordial y conversacional.
Respondé breve, natural y en español rioplatense.
No uses herramientas ni inventes datos financieros.
Si el usuario saluda, respondé con un saludo corto y amable.
Si pregunta quién sos o qué podés hacer, explicalo en una sola frase clara.
No menciones precios, tickers, noticias ni análisis financiero salvo que el usuario lo pida explícitamente.`;

      const greetingMessages = [{ role: "user" as const, content: latestUserText }];

      const smallTalkResult = await streamText({
        model: groq("llama-3.3-70b-versatile"),
        system: smallTalkPrompt,
        messages: await convertToModelMessages(greetingMessages),
      });

      return smallTalkResult.toUIMessageStreamResponse({
        headers: {
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-Sliding-Window": String(SLIDING_WINDOW),
          "X-Note": "Small-talk fallback without tools.",
        },
      });
    }

    if (!financialIntent) {
      const generalPrompt = `Sos InvertIA, un asistente conversacional útil y claro.
Respondé en español rioplatense, de forma breve y natural.
Si el usuario pregunta quién sos o qué funcionalidades tenés, describilo de manera simple.
Si la consulta no es financiera, respondé normalmente sin usar herramientas ni inventar datos.
Si el usuario mezcla temas, contestá sólo la parte general y pedí aclaración para la parte financiera.`;

      const generalResult = await streamText({
        model: groq("llama-3.3-70b-versatile"),
        system: generalPrompt,
        messages: await convertToModelMessages(windowedMessages),
      });

      return generalResult.toUIMessageStreamResponse({
        headers: {
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-Sliding-Window": String(SLIDING_WINDOW),
          "X-Note": "General chat fallback without tools.",
        },
      });
    }

    const messageTickers = extractRelevantTickers(messages);
    const freshTickers = Array.from(new Set([...portfolioTickers, ...messageTickers])).slice(0, 8);

    if (freshTickers.length > 0) {
      const freshQuotes = (await Promise.all(freshTickers.map((ticker) => getFreshMarketQuote(ticker)))).filter(
        (quote): quote is FreshMarketQuote => quote !== null
      );
      marketContext = formatMarketSnapshot(freshQuotes);
    }

    const systemPrompt = `Sos InvertIA, el asistente financiero inteligente de élite especializado en el mercado argentino.
Usuario: ${user.name ?? "usuario"}. Mercado: CEDEARs, BCBA, Bonos.

TU MISIÓN:
Proporcionar análisis financieros profundos, técnicos y visuales. No te limites a leer números; explica el "por qué".

SI EL USUARIO SOLO SALUDA O HACE CHITCHAT:
- Respondé de forma humana, cálida y breve.
- No muestres datos financieros ni uses herramientas.
- Podés devolver un saludo y una pregunta corta del estilo "¿en qué te ayudo?".

HERRAMIENTAS DISPONIBLES EXACTAMENTE:
- getHistoricalPerformance: rendimiento histórico de un ticker.
- getLatestNews: noticias recientes de un ticker.
- consultarPrecioMercado: precio puntual.
- consultarMiCartera: datos de cartera del usuario.
- calcularMetricas: métricas derivadas.
- explicarDecision: explicación de una decisión.

IMPORTANTE:
- No inventes nombres de herramientas.
- No intentes usar herramientas para saludos, identidad o preguntas generales.
- Si no hace falta una herramienta, respondé con texto normal.

REGLAS CRÍTICAS DE HERRAMIENTAS:
1. SIEMPRE que te pidan "COMPARAR", "MOSTRAR GRÁFICO" O "VER RENDIMIENTO", **DEBÉS** llamar a getHistoricalPerformance.
2. Si es una COMPARACIÓN (ej: ALUA vs TXAR), llamá a getHistoricalPerformance DOS VECES (una para cada ticker) en el MISMO PASO.
3. Si pides noticias, usá getLatestNews. Si no encuentras para el ticker local, intenta con el internacional.
4. NUNCA inventes números. Si la herramienta falla, explícalo técnicamente.

ESTILO DE RESPUESTA:
- Directo, profesional y basado en datos cuando haya consulta financiera.
- Cuando sea un saludo, respondé conversacionalmente sin formato técnico.
- Usá una lista numerada para conclusiones sólo cuando estés analizando datos.
- El usuario espera ver los gráficos automáticos. Sé breve en el texto.
- Máximo 150 palabras.

MERCADO ACTUAL YAHOO FINANCE:
${marketContext || "Sin snapshot de mercado disponible."}

${portfolioContext}`;

    const getHistoricalPerformance = tool({
      description: "Obtiene el rendimiento histórico de un activo para un período determinado. Retorna la serie de precios.",
      inputSchema: z.union([
        z.object({
          ticker: z.string().optional().describe("El ticker del activo (ej: YPF, AAPL)"),
          period: z.string().optional().describe("Días hacia atrás en formato texto (ej: '30')"),
        }),
        z.null(),
      ]),
      execute: async (input: { ticker?: string; period?: string } | null) => {
        const ticker = input?.ticker?.trim().toUpperCase() ?? "";
        const period = input?.period?.trim() ?? "30";

        if (!ticker) return { error: "Falta el ticker para consultar el historial." };

        const days = parseInt(period, 10) || 30;
        const symbol = toBCBASymbol(ticker);
        try {
          const chart = await yahooFinance.chart(symbol, {
            period1: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            interval: "1d",
          });
          const quotes = chart.quotes
            .filter(q => q.close !== null && q.date !== null)
            .map(q => ({
              date: q.date.toISOString(),
              close: q.close!
            }));

          if (quotes.length < 2) return { error: `No hay suficientes datos históricos para ${ticker}.` };

          const startPrice = quotes[0].close;
          const endPrice = quotes[quotes.length - 1].close;
          const change = ((endPrice / startPrice) - 1) * 100;

          return {
            ticker,
            symbol,
            days,
            change: Number(change.toFixed(2)),
            startPrice,
            endPrice,
            data: quotes // El componente ChatChart usará este array
          };
        } catch (err) {
          return { error: `Error consultando datos históricos de ${ticker}.` };
        }
      }
    });

    const getLatestNews = tool({
      description: "Busca las últimas noticias financieras de un activo específico.",
      inputSchema: z.union([
        z.object({
          ticker: z.string().optional().describe("El ticker del activo"),
        }),
        z.null(),
      ]),
      execute: async (input: { ticker?: string } | null) => {
        const ticker = input?.ticker?.trim().toUpperCase() ?? "";

        if (!ticker) return "Falta el ticker para buscar noticias.";

        const localSymbol = toBCBASymbol(ticker);
        const globalSymbol = ticker.includes('.') ? ticker.split('.')[0] : ticker;
        
        try {
          // Intentar primero con el símbolo local (Argentina)
          let results = await (yahooFinance as any).search(localSymbol);
          let news = (results && results.news) || [];
          
          // Si no hay noticias, intentar con el símbolo global (ej: MELI en vez de MELI.BA)
          if (news.length === 0 && localSymbol !== globalSymbol) {
            results = await (yahooFinance as any).search(globalSymbol);
            news = (results && results.news) || [];
          }

          if (news.length === 0) return `No se encontraron noticias recientes para ${ticker}.`;
          
          return news.slice(0, 4).map((n: any) => `- ${n.title} (${n.publisher})`).join("\n");
        } catch (err) {
          return `Error buscando noticias de ${ticker}.`;
        }
      }
    });

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages: await convertToModelMessages(windowedMessages),


      tools: {
        getHistoricalPerformance,
        getLatestNews,
        consultarPrecioMercado,
        consultarMiCartera: createConsultarMiCartera(user.id),
        calcularMetricas,
        explicarDecision,
      },

      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-Sliding-Window": String(SLIDING_WINDOW),
        "X-Note": "Tools enabled for enhanced context.",
      },
    });

  } catch (error: unknown) {
    const err = error as any;
    const message: string = err?.message ?? String(error);
    const errStr = message.toLowerCase();

    console.error("[Chat API Error] type=%s message=%s", err?.constructor?.name ?? "unknown", message);

    if (errStr.includes("failed_generation") || errStr.includes("tool call validation failed")) {
      const groq = createGroq({ apiKey: getGroqApiKey() });
      const recoveryPrompt = `Sos InvertIA. Respondé de forma breve, cordial y en español rioplatense.
No uses herramientas.
Si el usuario saludó o preguntó algo general, contestá normalmente y ofrecé ayuda sobre finanzas o sobre quién sos y qué hacés.`;

      const recoveryResult = await streamText({
        model: groq("llama-3.3-70b-versatile"),
        system: recoveryPrompt,
        messages: latestUserTextForFallback
          ? await convertToModelMessages([{ role: "user" as const, content: latestUserTextForFallback }])
          : [],
      });

      return recoveryResult.toUIMessageStreamResponse({
        headers: {
          "X-Note": "Recovered from invalid tool call generation.",
        },
      });
    }

    if (err?.status === 429 || errStr.includes("rate limit") || errStr.includes("quota")) {
      return new Response(
        "API Groq al límite. Esperá 10s e intentá de nuevo.",
        { status: 429, headers: { "Retry-After": "10" } }
      );
    }

    if (err?.status === 401 || err?.status === 403 || errStr.includes("api_key")) {
      return new Response(
        "Error de autenticación con Groq. Verificá GROQ_API_KEY.",
        { status: 503 }
      );
    }

    if (err?.status === 400 || errStr.includes("invalid")) {
      return new Response(`El modelo rechazó la solicitud: ${message}`, { status: 400 });
    }

    if (errStr.includes("prisma") || errStr.includes("econnrefused") || errStr.includes("database")) {
      return new Response("Error de BD. Verificá DATABASE_URL.", { status: 503 });
    }

    return new Response(`Error interno: ${message}`, { status: 500 });
  }
}
