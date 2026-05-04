import { createGroq } from "@ai-sdk/groq";

/**
 * Obtiene la API key de Groq.
 */
function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY no configurada en el entorno.");
  }
  return key;
}

/**
 * Crea una instancia del modelo Groq (Llama 3.3 70B por defecto).
 */
export function getGroqModel(modelName = "llama-3.3-70b-versatile") {
  const apiKey = getGroqApiKey();
  const groq = createGroq({ apiKey });
  return groq(modelName);
}
