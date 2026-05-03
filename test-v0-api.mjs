/**
 * test-v0-api.mjs
 * Test simple para verificar que la API de v0 funciona con /chat/completions.
 * Uso: node test-v0-api.mjs
 */

import { readFileSync } from "fs";

// Leer V0_API_KEY del .env.local
let apiKey = process.env.V0_API_KEY;
if (!apiKey) {
  try {
    const env = readFileSync(".env.local", "utf-8");
    const match = env.match(/^V0_API_KEY=(.+)$/m);
    if (match) apiKey = match[1].trim();
  } catch {}
}

if (!apiKey) {
  console.error("❌ ERROR: No se encontró V0_API_KEY en el entorno ni en .env.local");
  process.exit(1);
}

console.log(`🔑 API Key encontrada: ${apiKey.slice(0, 12)}...`);
console.log("📡 Llamando a https://api.v0.dev/v1/chat/completions ...\n");

const body = {
  model: "v0-1.5-md",
  stream: false,
  messages: [
    { role: "user", content: "Responde solo: OK" }
  ]
};

try {
  const res = await fetch("https://api.v0.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} ${res.statusText}`);
    console.error("Response body:", text);
    process.exit(1);
  }

  const reply = json?.choices?.[0]?.message?.content ?? "(sin contenido)";
  console.log(`✅ HTTP ${res.status} - Respuesta del modelo:`);
  console.log(`   "${reply}"`);
  console.log("\n🎉 La API de v0 funciona correctamente con /chat/completions");
} catch (err) {
  console.error("❌ Error de red:", err.message);
  process.exit(1);
}
