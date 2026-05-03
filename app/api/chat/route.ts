import { streamText, convertToModelMessages } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPortfolio } from "@/lib/services/portfolio.service";
import { formatARS, formatPercent } from "@/lib/utils";

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

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
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
    if (portfolioStatusHint === "cached_unchanged") {
      portfolioContext = `[CARTERA] Sin cambios desde ultimo msg.`;
    } else {
      try {
        const portfolio = await getPortfolio(user.id);
        if (portfolio && portfolio.assets.length > 0) {
          const assetsDescription = portfolio.assets
            .map((asset) => {
              const gainPercentAsset = asset.avgBuyPrice ? ((asset.currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice) * 100 : 0;
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
      }
    }

    const systemPrompt = `Sos InvertIA, asistente financiero especializado en mercado argentino.
Usuario: ${user.name ?? "usuario"}. Mercado: CEDEARs, BCBA, Bonos.

MÁXIMA BREVEDAD: Máximo 200 palabras. 2-3 párrafos.

OBLIGATORIO:
1. QUIÉN CAMBIÓ: Activo y cuanto. 1 linea con datos.
2. POR QUÉ: Factores específicos. DATOS si existen.
3. QUÉ ESPERAR: Rango probable o escenario.

REGLAS: CERO preámbulos, saludos, introducciones. Sé directo.
CEDEARs=USD global, BCBA=Economía Argentina.
Sin especulación. Sin ejemplos genéricos.

${portfolioContext}`;

    const SLIDING_WINDOW = 6;
    const windowedMessages = messages.slice(-SLIDING_WINDOW);

    const groq = createGroq({ apiKey: getGroqApiKey() });

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages: await convertToModelMessages(windowedMessages),
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-Sliding-Window": String(SLIDING_WINDOW),
        "X-Note": "Tools disabled for Groq compatibility. Using RAG only.",
      },
    });

  } catch (error: unknown) {
    const err = error as any;
    const message: string = err?.message ?? String(error);
    const errStr = message.toLowerCase();

    console.error("[Chat API Error] type=%s message=%s", err?.constructor?.name ?? "unknown", message);

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
