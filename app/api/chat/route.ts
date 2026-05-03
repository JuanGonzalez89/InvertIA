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
      portfolioContext = `
Nota: La cartera del usuario no ha cambiado desde el último mensaje. Úsala según el contexto anterior.`;
    } else {
      try {
        const portfolio = await getPortfolio(user.id);
        if (portfolio && portfolio.assets.length > 0) {
          const assetsDescription = portfolio.assets
            .map(
              (asset) =>
                `${asset.ticker}\t${asset.quantity}\t${formatARS(asset.currentPrice)}\t${formatARS(asset.avgBuyPrice)}`
            )
            .join("\n");

          portfolioContext = `
CARTERA (${new Date().toLocaleTimeString()}):
${assetsDescription}
Total: ${formatARS(portfolio.totalCurrentValue)} | Invertido: ${formatARS(portfolio.totalInvested)} | Ganancia: ${formatARS(portfolio.totalGainLoss)} (${formatPercent(portfolio.gainLossPercent)})`;
        }
      } catch (err) {
        console.error("Error retrieving portfolio for RAG:", err);
      }
    }

    const systemPrompt = `Sos InvertIA, asistente financiero del mercado argentino.
Usuario: ${user.name ?? "usuario"}.
Especialidad: CEDEARs, Bonos, Acciones BCBA.
Instrucciones:
- Responde directamente sin preámbulos
- Máximo 15 palabras por viñeta/punto
- Usa análisis factual basado en la cartera del usuario
- Si necesitas datos específicos de mercado, pídele al usuario que te proporcione el ticker${portfolioContext}`.trim();

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
