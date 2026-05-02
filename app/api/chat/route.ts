import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCurrentUser } from "@/lib/auth/get-current-user";
// Importá tus tools acá:
// import { consultarMiCartera } from "@/lib/tools/consultar-mi-cartera";
// import { calcularDolarImplicito } from "@/lib/tools/calcular-dolar-implicito";

// 1. CREAMOS EL CLIENTE PASANDO POR VERCEL AI GATEWAY
const vercelAI = createOpenAI({
  baseURL: process.env.AI_GATEWAY_URL, // <-- Vercel intercepta acá
  apiKey: process.env.OPENAI_API_KEY, // <-- Y usa esta llave por detrás
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

    // 3. Prompt Maestro del Agente
    const systemPrompt = `
Sos InvertIA, un asistente financiero especializado en el mercado argentino (CEDEARs, Bonos, Acciones de la BCBA).
El nombre del usuario es: ${user.name ?? "usuario"}.
Tu rol es ayudar a gestionar la cartera y analizar el mercado.
Hablás en español de Argentina de forma clara, directa y profesional.
NUNCA inventes precios. Si no podés usar una tool para consultar un precio real, decilo claramente.
`.trim();

    // 4. El stream con el modelo ruteado por el Gateway
    const result = await streamText({
      model: vercelAI("gpt-4o"), // o 'gpt-4-turbo' si prefieren
      system: systemPrompt,
      messages,
      maxSteps: 5, // Fundamental para que el agente pueda encadenar llamadas a tools
      tools: {
        // Descomentá las tools que ya armaron en la Fase 4:
        // consultarMiCartera,
        // calcularDolarImplicito,
        // consultarPrecioMercado,
        // calcularMetricas,
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[Chat API Error]:", error);
    return new Response("Error procesando la solicitud en el AI Gateway", { status: 500 });
  }
}