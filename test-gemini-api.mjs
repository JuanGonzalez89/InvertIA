/**
 * test-gemini-api.mjs
 * Test simple: verifica que la API key de Gemini funciona con /v1beta/models.
 * Uso: node test-gemini-api.mjs
 */

import { readFileSync } from "fs";

// Leer GEMINI_API_KEY del .env.local
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  try {
    const env = readFileSync(".env.local", "utf-8");
    const match = env.match(/^GEMINI_API_KEY=(.+)$/m);
    if (match) apiKey = match[1].trim();
  } catch {}
}

if (!apiKey) {
  console.error("❌ No se encontró GEMINI_API_KEY en .env.local");
  process.exit(1);
}

console.log(`🔑 Key encontrada: ${apiKey.slice(0, 12)}...`);
console.log("📡 Llamando a Gemini 2.5 Flash...\n");

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const body = {
  contents: [{ role: "user", parts: [{ text: "Responde solo: OK" }] }],
  generationConfig: { maxOutputTokens: 10 }
};

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}`);
    console.error("Error:", JSON.stringify(json.error, null, 2));
    process.exit(1);
  }

  const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "(sin respuesta)";
  console.log(`✅ HTTP ${res.status} - Respuesta: "${reply.trim()}"`);
  console.log(`📊 Tokens usados: input=${json.usageMetadata?.promptTokenCount} output=${json.usageMetadata?.candidatesTokenCount}`);
  console.log("\n🎉 Gemini 2.5 Flash funciona correctamente. El chat debería andar.");
} catch (err) {
  console.error("❌ Error de red:", err.message);
  process.exit(1);
}
