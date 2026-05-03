
import 'dotenv/config';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const vercelAI = createOpenAI({
  baseURL: 'https://gateway.ai.cloudflare.com/v1/fb26447a55a3602358462805349c0d23/invertia/openai',
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

async function main() {
  console.log('Probando conexión con Vercel AI Gateway...');
  try {
    const result = await streamText({
      model: vercelAI('gpt-4o'),
      prompt: 'Hola, ¿puedes presentarte?',
    });

    console.log('Respuesta recibida:');
    for await (const text of result.textStream) {
      process.stdout.write(text);
    }
    console.log('\n\nPrueba finalizada con éxito.');
  } catch (error) {
    console.error('Error durante la prueba de Vercel AI Gateway:', error);
  }
}

main();
