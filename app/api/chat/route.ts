import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPortfolio } from "@/lib/services/portfolio.service";
import { createConsultarMiCartera } from "@/lib/tools/consultar-mi-cartera";
import { consultarPrecioMercado } from "@/lib/tools/consultar-precio-mercado";
import { calcularMetricas } from "@/lib/tools/calcular-metricas";
import { explicarDecision } from "@/lib/tools/explicar-decision";
import { formatARS, formatPercent } from "@/lib/utils";

// 1. CLIENTE v0 (Vercel AI - compatible con OpenAI SDK)
const v0 = createOpenAI({
  baseURL: "https://api.v0.dev/v1",
  apiKey: process.env.V0_API_KEY,
  compatibility: "compatible", // Fuerza /chat/completions en vez del nuevo /responses endpoint
});

export const maxDuration = 60;

// ─── Rate Limiter (10 intentos / minuto por usuario) ──────────────────────────
// Nota: en-memoria → se resetea por cold start en Vercel (aceptable para demo)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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
    // 2. Autenticación
    const user = await getCurrentUser();
    if (!user) {
      return new Response("No autorizado", { status: 401 });
    }

    // 3. Rate limiting por usuario
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) {
      const secsLeft = Math.ceil(rl.resetIn / 1000);
      return new Response(
        `Límite de 10 consultas por minuto alcanzado. Podés volver a preguntar en ${secsLeft} segundos.`,
        {
          status: 429,
          headers: {
            "Retry-After": String(secsLeft),
            "X-RateLimit-Limit": String(RATE_LIMIT),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await req.json();
    const { messages, id: chatId } = body;

    console.log(
      "[Chat API] provider=v0 chatId=%s messages_count=%d rl_remaining=%d",
      chatId,
      messages?.length ?? 0,
      rl.remaining
    );

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("El cuerpo de la solicitud no contiene mensajes válidos.", { status: 400 });
    }

    // 4. RAG: Recuperar contexto de cartera del usuario
    let portfolioContext = "";
    try {
      const portfolio = await getPortfolio(user.id);
      if (portfolio && portfolio.assets.length > 0) {
        const assetsDescription = portfolio.assets
          .map(
            (asset) =>
              `- ${asset.ticker} (${asset.type}): ${asset.quantity} unidades @ ${formatARS(asset.currentPrice)} c/u (compra promedio: ${formatARS(asset.avgBuyPrice)})`
          )
          .join("\n");

        portfolioContext = `

CONTEXTO DE CARTERA DEL USUARIO (Información Actual):
- Valor total de cartera: ${formatARS(portfolio.totalCurrentValue)}
- Total invertido: ${formatARS(portfolio.totalInvested)}
- Ganancia/Pérdida: ${formatARS(portfolio.totalGainLoss)} (${formatPercent(portfolio.gainLossPercent)})
- Activos en cartera:
${assetsDescription}`;
      }
    } catch (err) {
      console.error("Error retrieving portfolio for RAG:", err);
      // Continuar sin contexto si hay error
    }

    // 5. Prompt Maestro del Agente
    const systemPrompt = `
Sos InvertIA, un asistente financiero especializado en el mercado argentino (CEDEARs, Bonos, Acciones de la BCBA).
El nombre del usuario es: ${user.name ?? "usuario"}.
Tu rol es ayudar a gestionar la cartera y analizar el mercado.
Hablás en español de Argentina de forma clara, directa y profesional.
NUNCA inventes precios. Si no podés usar una tool para consultar un precio real, decilo claramente.${portfolioContext}
`.trim();

    // 6. Stream con v0
    const result = await streamText({
      model: v0("v0-1.5-md"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools: {
        consultarMiCartera: createConsultarMiCartera(user.id),
        consultarPrecioMercado,
        calcularMetricas,
        explicarDecision,
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT),
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });

  } catch (error: unknown) {
    const err = error as any;
    const message: string = err?.message ?? String(error);
    const errStr = message.toLowerCase();

    console.error("[Chat API Error] type=%s message=%s", err?.constructor?.name ?? "unknown", message);

    // Rate limit del proveedor
    if (err?.status === 429 || errStr.includes("rate limit") || errStr.includes("quota")) {
      return new Response(
        "Límite de uso de la API de v0 alcanzado. Intentá de nuevo en unos minutos.",
        { status: 429 }
      );
    }

    // API key inválida
    if (err?.status === 401 || err?.status === 403 || errStr.includes("api_key") || errStr.includes("unauthorized")) {
      return new Response(
        "Error de autenticación con la API de v0. Verificá la variable V0_API_KEY en Vercel.",
        { status: 503 }
      );
    }

    // Solicitud inválida
    if (err?.status === 400 || errStr.includes("invalid") || errStr.includes("bad request")) {
      return new Response(
        `El modelo rechazó la solicitud: ${message}`,
        { status: 400 }
      );
    }

    // Error de base de datos
    if (errStr.includes("prisma") || errStr.includes("econnrefused") || errStr.includes("database")) {
      return new Response(
        "No se pudo conectar a la base de datos. Verificá DATABASE_URL en Vercel.",
        { status: 503 }
      );
    }

    return new Response(
      `Error interno del servidor: ${message}`,
      { status: 500 }
    );
  }
}
