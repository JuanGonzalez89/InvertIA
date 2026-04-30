import { CoreMessage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 30;

// Configuración del Vercel AI Gateway
const openai = createOpenAI({
  baseURL: 'https://gateway.vercel.ai/v1/v1',
  apiKey: process.env.OPENAI_API_KEY, 
});

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  return result.toDataStreamResponse();
}
