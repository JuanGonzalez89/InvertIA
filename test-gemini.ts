import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import dotenv from "dotenv";
import { consultarPrecioMercado } from "./lib/tools/consultar-precio-mercado";

dotenv.config({ path: ".env.local" });

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  console.log("Iniciando prueba con Gemini (Google) directo...");
  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"), // o gemini-2.5-pro
      system: "Sos un asistente financiero. Tienes acceso a herramientas.",
      messages: [{ role: "user", content: "¿Cuál es el precio de AAPL? Usa la tool y respondé con el precio." }],
      tools: {
        consultarPrecioMercado
      },
      maxSteps: 5
    });

    console.log("\n[RESPUESTA FINAL DEL AGENTE]:");
    console.log(JSON.stringify({ text: result.text, steps: result.steps?.map(s => ({ text: s.text, toolCalls: s.toolCalls, toolResults: s.toolResults })) }, null, 2));
    console.log("\nPrueba exitosa ✅");
  } catch (error) {
    console.error("Error en la prueba:", error);
  }
}

main();
