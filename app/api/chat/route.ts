import { streamText } from "ai";
import { openai } from "@ai-sdk/openai"; // o anthropic, según elección
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createConsultarMiCartera } from "@/lib/tools/consultar-mi-cartera";
import { consultarPrecioMercado } from "@/lib/tools/consultar-precio-mercado";
import { calcularMetricas } from "@/lib/tools/calcular-metricas";
import { explicarDecision } from "@/lib/tools/explicar-decision";
import { stepCountIs } from "ai";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 60; // Vercel Serverless: máximo 60s para el stream

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { error: "NO_AUTH", message: "Necesitas iniciar sesion para usar el chat." },
      { status: 401 }
    );
  }

  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    return Response.json(
      {
        error: "USER_SYNC_FAILED",
        message:
          "Tu sesion esta activa, pero hubo un error sincronizando usuario con la base de datos.",
      },
      { status: 503 }
    );
  }

  if (!user) {
    return Response.json(
      {
        error: "USER_NOT_FOUND",
        message:
          "No encontramos tu usuario en base de datos. Reintenta en unos segundos.",
      },
      { status: 404 }
    );
  }

  const { messages } = await req.json();
  const consultarMiCartera = createConsultarMiCartera(user.id);

  const systemPrompt = `
Sos InvertIA, un asistente financiero especializado en el mercado argentino: CEDEARs, Bonos, Acciones de la BCBA.

Tu rol:
- Ayudás a ${user.name ?? "el usuario"} a entender su cartera y el mercado.
- Siempre consultás datos reales antes de responder sobre precios o posiciones.
- Antes de cualquier recomendación, usás la tool "explicarDecision" para estructurar tu análisis.
- Hablás en español. Sos directo, claro y honesto sobre la incertidumbre.

Reglas estrictas:
1. NUNCA inventes precios. Si no podés consultar un precio, decilo claramente.
2. Si el usuario no tiene cartera registrada, invitalo a cargar sus primeras transacciones.
3. Siempre advertís que tus análisis no reemplazan a un asesor financiero habilitado.
4. Si hay un error de mercado (429, conexión caída), respondés de forma empática y sugerís reintentar.

El ID del usuario en la base de datos es: ${user.id}
Nombre del usuario: ${user.name ?? "usuario"}
`.trim();

  const result = await streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    tools: {
      consultarMiCartera,
      consultarPrecioMercado,
      calcularMetricas,
      explicarDecision,
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}