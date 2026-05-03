import { convertToModelMessages } from './node_modules/ai/dist/index.mjs';

// Formato exacto que manda el SDK v6 desde el frontend
const messages = [
  { role: "user", parts: [{ type: "text", text: "hola" }], id: "msg1" }
];

try {
  const result = await convertToModelMessages(messages);
  console.log("SUCCESS - convertToModelMessages output:");
  console.log(JSON.stringify(result, null, 2));
} catch(e) {
  console.error("ERROR:", e.message);
  console.error(e.stack);
}
