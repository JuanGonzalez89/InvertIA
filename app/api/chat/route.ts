import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPortfolio } from "@/lib/services/portfolio.service";
import { createConsultarMiCartera } from "@/lib/tools/consultar-mi-cartera";
import { consultarPrecioMercado } from "@/lib/tools/consultar-precio-mercado";
import { calcularMetricas } from "@/lib/tools/calcular-metricas";
import { explicarDecision } from "@/lib/tools/explicar-decision";
import { formatARS, formatPercent } from "@/lib/utils";

// 1. CREAMOS EL CLIENTE DE GEMINI
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 60; // Importante para que Vercel no corte la función por timeout

export async function POST(req: Request) {
  try {
    // 2. Autenticación
    const user = await getCurrentUser();
    if (!user) {
      return new Response("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { messages, id: chatId } = body;

    // DEBUG: loguear el body completo para entender qué manda el frontend
    console.log("[Chat API] chatId=%s messages_count=%d first_msg=%s", chatId, messages?.length ?? 0, JSON.stringify(messages?.[0]));

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("El cuerpo de la solicitud no contiene mensajes válidos.", { status: 400 });
    }

    // 3. RAG: Recuperar contexto de cartera del usuario
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

    // 4. Prompt Maestro del Agente
    const systemPrompt = `
Sos InvertIA, un asistente financiero especializado en el mercado argentino (CEDEARs, Bonos, Acciones de la BCBA).
El nombre del usuario es: ${user.name ?? "usuario"}.
Tu rol es ayudar a gestionar la cartera y analizar el mercado.
Hablás en español de Argentina de forma clara, directa y profesional.
NUNCA inventes precios. Si no podés usar una tool para consultar un precio real, decilo claramente.${portfolioContext}
`.trim();

    // 5. El stream con el modelo Gemini
    const result = await streamText({
      model: google("gemini-2.5-flash"), // u otro modelo de Gemini como gemini-2.0-pro
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(5), // Fundamental para que el agente pueda encadenar llamadas a tools
      tools: {
        consultarMiCartera: createConsultarMiCartera(user.id),
        consultarPrecioMercado,
        calcularMetricas,
        explicarDecision,
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    // --- Clasificación de errores para mensajes accionables ---
    const err = error as any;
    const message: string = err?.message ?? String(error);
    const errStr = message.toLowerCase();

    console.error("[Chat API Error] type=%s message=%s", err?.constructor?.name ?? "unknown", message);

    // 1. Quota / Rate limit de Gemini
    if (err?.status === 429 || errStr.includes("quota") || errStr.includes("rate limit") || errStr.includes("resource_exhausted")) {
      return new Response(
        "Límite de uso de la API de Gemini alcanzado. Intentá de nuevo en unos minutos.",
        { status: 429 }
      );
    }

    // 2. API key inválida o no autorizada en Gemini
    if (err?.status === 401 || err?.status === 403 || errStr.includes("api_key") || errStr.includes("api key") || errStr.includes("unauthorized")) {
      return new Response(
        "Error de autenticación con la API de Gemini. Verificá la variable GEMINI_API_KEY en Vercel.",
        { status: 503 }
      );
    }

    // 3. Solicitud inválida al modelo (formato de mensajes, tool schema, etc.)
    if (err?.status === 400 || errStr.includes("invalid") || errStr.includes("bad request") || errStr.includes("schema")) {
      return new Response(
        `El modelo rechazó la solicitud por formato inválido: ${message}`,
        { status: 400 }
      );
    }

    // 4. Error de base de datos / Prisma
    if (errStr.includes("prisma") || errStr.includes("econnrefused") || errStr.includes("database") || errStr.includes("p2")) {
      return new Response(
        "No se pudo conectar a la base de datos. Verificá DATABASE_URL en Vercel.",
        { status: 503 }
      );
    }

    // 5. Error genérico con mensaje real expuesto para debugging
    return new Response(
      `Error interno del servidor: ${message}`,
      { status: 500 }
    );
  }
}
