import { streamText, stepCountIs } from "ai";
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

    const { messages } = await req.json();

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
      messages,
      stopWhen: stepCountIs(5), // Fundamental para que el agente pueda encadenar llamadas a tools
      tools: {
        consultarMiCartera: createConsultarMiCartera(user.id),
        consultarPrecioMercado,
        calcularMetricas,
        explicarDecision,
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[Chat API Error]:", error);
    return new Response("Error procesando la solicitud en el AI Gateway", { status: 500 });
  }
}
