import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPortfolio } from "@/lib/services/portfolio.service";
import { createConsultarMiCartera } from "@/lib/tools/consultar-mi-cartera";
import { consultarPrecioMercado } from "@/lib/tools/consultar-precio-mercado";
import { calcularMetricas } from "@/lib/tools/calcular-metricas";
import { explicarDecision } from "@/lib/tools/explicar-decision";
import { formatARS, formatPercent } from "@/lib/utils";

// ─── Multi-Key Rotation ────────────────────────────────────────────────────────
// Soporta hasta 5 keys via GEMINI_API_KEY, GEMINI_API_KEY_2 ... GEMINI_API_KEY_5
// Cada key free tier tiene 10 RPM → 3 keys = 30 RPM efectivos.
// Generá keys gratis en: https://aistudio.google.com/app/apikey
function getApiKeys(): string[] {
  const keys: string[] = [];
  const k1 = process.env.GEMINI_API_KEY;
  if (k1) keys.push(k1);
  for (let i = 2; i <= 5; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  if (keys.length === 0) throw new Error("No se encontró ninguna GEMINI_API_KEY en las variables de entorno.");
  return keys;
}

// Round-robin atómico: distribuye requests entre todas las keys
let _keyIndex = 0;
function nextKey(keys: string[]): string {
  const key = keys[_keyIndex % keys.length];
  _keyIndex++;
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
    // 2. Autenticación
    const user = await getCurrentUser();
    if (!user) {
      return new Response("No autorizado", { status: 401 });
    }

    // 3. Rate limiting (app-side, protección contra abuso)
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) {
      const secsLeft = Math.ceil(rl.resetIn / 1000);
      return new Response(
        `Límite alcanzado. Podés volver a preguntar en ${secsLeft} segundos.`,
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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("El cuerpo de la solicitud no contiene mensajes válidos.", { status: 400 });
    }

    // 4. Seleccionar API key (round-robin entre todas las configuradas)
    const keys = getApiKeys();
    const apiKey = nextKey(keys);
    const keyNum = (_keyIndex % keys.length) + 1;

    console.log(
      "[Chat API] provider=gemini model=gemini-2.5-flash key=%d/%d chatId=%s msgs=%d rl_rem=%d",
      keyNum, keys.length, chatId, messages?.length ?? 0, rl.remaining
    );

    // 5. RAG: Recuperar contexto de cartera del usuario
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
    }

    // 6. Prompt Maestro del Agente
    const systemPrompt = `
Sos InvertIA, un asistente financiero especializado en el mercado argentino (CEDEARs, Bonos, Acciones de la BCBA).
El nombre del usuario es: ${user.name ?? "usuario"}.
Tu rol es ayudar a gestionar la cartera y analizar el mercado.
Hablás en español de Argentina de forma clara, directa y profesional.
NUNCA inventes precios. Si no podés usar una tool para consultar un precio real, decilo claramente.${portfolioContext}
`.trim();

    // 7. Stream con Gemini 2.5 Flash (key rotada)
    const google = createGoogleGenerativeAI({ apiKey });

    const result = await streamText({
      model: google("gemini-2.5-flash"),
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
        "X-Gemini-Keys-Count": String(keys.length),
      },
    });

  } catch (error: unknown) {
    const err = error as any;
    const message: string = err?.message ?? String(error);
    const errStr = message.toLowerCase();

    console.error("[Chat API Error] type=%s message=%s", err?.constructor?.name ?? "unknown", message);

    // Rate limit de Gemini (429): sucede si todas las keys están saturadas a la vez
    if (err?.status === 429 || errStr.includes("rate limit") || errStr.includes("quota") || errStr.includes("resource_exhausted")) {
      return new Response(
        "Todas las APIs están al límite en este momento. Esperá unos segundos e intentá de nuevo.",
        { status: 429, headers: { "Retry-After": "10" } }
      );
    }

    // API key inválida
    if (err?.status === 401 || err?.status === 403 || errStr.includes("api_key") || errStr.includes("unauthorized") || errStr.includes("api key")) {
      return new Response(
        "Error de autenticación con Gemini. Verificá las variables GEMINI_API_KEY en el entorno.",
        { status: 503 }
      );
    }

    // Solicitud inválida
    if (err?.status === 400 || errStr.includes("invalid") || errStr.includes("bad request")) {
      return new Response(`El modelo rechazó la solicitud: ${message}`, { status: 400 });
    }

    // Error de base de datos
    if (errStr.includes("prisma") || errStr.includes("econnrefused") || errStr.includes("database")) {
      return new Response("No se pudo conectar a la base de datos. Verificá DATABASE_URL.", { status: 503 });
    }

    return new Response(`Error interno del servidor: ${message}`, { status: 500 });
  }
}
