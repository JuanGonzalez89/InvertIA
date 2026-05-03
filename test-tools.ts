import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import dotenv from "dotenv";
import { createConsultarMiCartera } from "./lib/tools/consultar-mi-cartera";
import { calcularMetricas } from "./lib/tools/calcular-metricas";
import { explicarDecision } from "./lib/tools/explicar-decision";

dotenv.config({ path: ".env.local" });

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testTool(prompt: string, tools: any, name: string) {
  console.log(`\n========================================`);
  console.log(`Probando tool(s) para la consulta: "${prompt}"`);
  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: "Sos un asistente financiero argentino. Usa SIEMPRE una tool para responder. No respondas con texto libre si podes usar una tool.",
      messages: [{ role: "user", content: prompt }],
      tools,
      maxSteps: 5
    });

    const stepWithTool = result.steps?.find(s => s.toolResults && s.toolResults.length > 0);
    if (stepWithTool) {
      console.log(`✅ ¡Tool ejecutada exitosamente!`);
      console.log(`Tool Result:`, JSON.stringify(stepWithTool.toolResults, null, 2));
    } else {
      console.log(`❌ No se ejecutó ninguna tool. Respuesta del modelo: ${result.text}`);
    }
  } catch (err: any) {
    console.error(`❌ Error en la prueba de ${name}:`, err.message || err);
  }
}

async function main() {
  const userId = process.env.NEXT_PUBLIC_MOCK_USER_ID || "test_user";
  const allTools = {
    consultarMiCartera: createConsultarMiCartera(userId),
    calcularMetricas,
    explicarDecision
  };

  await testTool("Compré 50 unidades a 1000 ARS y ahora valen 1500 ARS. Ejecuta la tool para calcular las métricas.", { calcularMetricas }, "calcularMetricas");
  await testTool("Ejecutá la tool de decisión para recomendar COMPRAR AAPL.", { explicarDecision }, "explicarDecision");
  await testTool("Mostrame el estado de mi cartera de inversiones.", { consultarMiCartera: allTools.consultarMiCartera }, "consultarMiCartera");
}

main();
