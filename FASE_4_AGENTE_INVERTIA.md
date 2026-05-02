# Fase 4: El Cerebro — Agente Autónomo de InvertIA 🧠

Con la infraestructura de autenticación y base de datos sólida (Fase 3), conectamos la aplicación a un LLM real, dotándolo de herramientas específicas para el mercado argentino. El foco de esta fase es la **experiencia del usuario**: el agente debe razonar en voz alta, nunca alucinar, y responder como un asesor financiero paciente, no como un chatbot genérico.

---

## ✅ Objetivos de la Fase

1. Configurar el endpoint de chat con streaming real (`api/chat/route.ts`)
2. Centralizar el cliente de Yahoo Finance con manejo de errores y caché
3. Implementar las 4 tools del agente con validaciones robustas
4. Escribir el system prompt que define la personalidad y límites del agente
5. Conectar el frontend `/chat` al stream del agente

---

## 📁 Archivos a Crear / Modificar

```
lib/
  yahoo.ts                          ← NUEVO: cliente centralizado Yahoo Finance
  cache/
    market-cache.ts                 ← NUEVO: caché en memoria con TTL
  tools/
    consultar-mi-cartera.ts         ← NUEVO: tool interna (Prisma)
    consultar-precio-mercado.ts     ← NUEVO: tool externa (Yahoo)
    calcular-metricas.ts            ← NUEVO: tool de cálculo P&L
    explicar-decision.ts            ← NUEVO: tool de razonamiento explícito

app/
  api/
    chat/
      route.ts                      ← MODIFICAR: integrar streamText + tools
  (chat)/
    page.tsx                        ← MODIFICAR: conectar al stream real
```

---

## Paso 1 — Caché en Memoria (`lib/cache/market-cache.ts`)

> **Por qué primero el caché**: Yahoo Finance no tiene una API oficial; es web scraping. Si el agente encadena 3 preguntas sobre la misma acción en 2 minutos, sin caché van 3 requests a Yahoo. Con caché, va 1.

```typescript
// lib/cache/market-cache.ts

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MarketCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlSeconds = 300): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

// Singleton: vive mientras la instancia de Node está activa
export const marketCache = new MarketCache();
```

**Nota de escalabilidad**: Para producción real, reemplazar este Map por Redis (Upstash funciona perfecto con Vercel). Para la hackathon, el Map en memoria es suficiente porque las Serverless Functions de Vercel tienen warm starts frecuentes en desarrollo local.

---

## Paso 2 — Cliente Yahoo Finance (`lib/yahoo.ts`)

> El cliente se instancia **una sola vez** y se configura globalmente. Ninguna tool importa `yahoo-finance2` directamente; todas importan desde acá.

```typescript
// lib/yahoo.ts
import yahooFinance from "yahoo-finance2";

yahooFinance.setGlobalConfig({
  validation: {
    logErrors: false,    // Silencia warnings de campos deprecados de Yahoo
    logErrors: false,
  },
});

// Campos mínimos: menos tokens al LLM, respuesta más rápida
export const QUOTE_FIELDS = [
  "regularMarketPrice",
  "currency",
  "regularMarketChangePercent",
  "regularMarketVolume",
  "shortName",
] as const;

// Parser silencioso: el LLM manda "AAPL", nosotros buscamos "AAPL.BA"
// Si el ticker ya tiene sufijo (ej: "GGAL.BA"), lo respeta tal cual
export function toBCBASymbol(ticker: string): string {
  if (ticker.includes(".")) return ticker.toUpperCase();
  return `${ticker.toUpperCase()}.BA`;
}

export { yahooFinance };
```

---

## Paso 3 — Las 4 Tools del Agente

### Tool 1: `consultarMiCartera` (datos internos)

```typescript
// lib/tools/consultar-mi-cartera.ts
import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";

export const consultarMiCartera = tool({
  description:
    "Consulta las posiciones actuales del usuario en su cartera: qué activos tiene, cuántas unidades y a qué precio promedio de compra. Úsala cuando el usuario pregunte por su cartera, sus tenencias o quiera saber qué tiene.",
  parameters: z.object({
    userId: z.string().describe("ID del usuario en la base de datos"),
  }),
  execute: async ({ userId }) => {
    console.log(`[Tool] consultarMiCartera → userId: ${userId}`);
    
    try {
      const positions = await db.position.findMany({
        where: { userId },
        include: { asset: true },
      });

      if (positions.length === 0) {
        return {
          tieneCartera: false,
          mensaje: "El usuario no tiene posiciones registradas aún.",
        };
      }

      return {
        tieneCartera: true,
        posiciones: positions.map((p) => ({
          ticker: p.asset.symbol,
          nombre: p.asset.name,
          cantidad: p.quantity,
          precioPromedio: p.averagePrice,
          moneda: p.asset.currency ?? "ARS",
        })),
      };
    } catch (error) {
      console.error("[Tool] consultarMiCartera error:", error);
      return { error: "No se pudo leer la cartera. Intentá de nuevo." };
    }
  },
});
```

### Tool 2: `consultarPrecioMercado` (datos externos + caché)

```typescript
// lib/tools/consultar-precio-mercado.ts
import { tool } from "ai";
import { z } from "zod";
import { yahooFinance, toBCBASymbol, QUOTE_FIELDS } from "@/lib/yahoo";
import { marketCache } from "@/lib/cache/market-cache";

export const consultarPrecioMercado = tool({
  description:
    "Obtiene el precio de mercado actual de un activo en la Bolsa de Buenos Aires (BYMA/BCBA). Recibe el ticker base como 'AAPL', 'NVDA' o 'GGAL' y busca automáticamente el precio en pesos. Usala cuando necesites el precio actual de mercado.",
  parameters: z.object({
    ticker: z
      .string()
      .describe(
        "Símbolo del activo sin sufijo. Ejemplos: 'AAPL', 'NVDA', 'GGAL', 'MELI'"
      ),
  }),
  execute: async ({ ticker }) => {
    const symbol = toBCBASymbol(ticker);
    console.log(`[Tool] consultarPrecioMercado → buscando ${symbol}`);

    // 1. Chequear caché primero
    const cached = marketCache.get<object>(symbol);
    if (cached) {
      console.log(`[Tool] consultarPrecioMercado → hit de caché para ${symbol}`);
      return cached;
    }

    // 2. Llamar a Yahoo con campos mínimos
    try {
      const quote = await yahooFinance.quote(symbol, {
        fields: QUOTE_FIELDS,
      });

      if (!quote.regularMarketPrice) {
        return {
          error: "Activo no encontrado en BCBA",
          sugerencia: `No encontré cotización para ${ticker} en la bolsa argentina. Verificá que el ticker sea correcto.`,
        };
      }

      const resultado = {
        ticker: symbol,
        tickerBase: ticker,
        precio: quote.regularMarketPrice,
        moneda: quote.currency ?? "ARS",
        variacionPorcentual: quote.regularMarketChangePercent?.toFixed(2),
        volumen: quote.regularMarketVolume,
        nombre: quote.shortName,
      };

      // 3. Guardar en caché por 5 minutos
      marketCache.set(symbol, resultado, 300);

      return resultado;
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("Too Many"));

      if (isRateLimit) {
        return {
          error: "Sistemas de cotización saturados",
          sugerencia:
            "Los servidores de datos del mercado están con mucho tráfico ahora mismo. Podés intentar en 5 minutos o consultar otra acción.",
        };
      }

      console.error(`[Tool] consultarPrecioMercado error para ${symbol}:`, error);
      return {
        error: "No se pudo obtener la cotización",
        sugerencia: "Hubo un error de conexión. Probá con otro ticker o intentá más tarde.",
      };
    }
  },
});
```

### Tool 3: `calcularMetricas` (cálculos de P&L)

```typescript
// lib/tools/calcular-metricas.ts
import { tool } from "ai";
import { z } from "zod";

export const calcularMetricas = tool({
  description:
    "Calcula métricas financieras de una posición: ganancia/pérdida en pesos y porcentaje, valuación actual total. Usala después de tener el precio de mercado y los datos de la cartera del usuario.",
  parameters: z.object({
    precioCompra: z.number().describe("Precio promedio de compra en ARS"),
    precioActual: z.number().describe("Precio actual de mercado en ARS"),
    cantidad: z.number().describe("Cantidad de unidades en posesión"),
  }),
  execute: async ({ precioCompra, precioActual, cantidad }) => {
    console.log(`[Tool] calcularMetricas → ${cantidad} unidades @ $${precioCompra} → $${precioActual}`);

    const costoBruto = precioCompra * cantidad;
    const valuacionActual = precioActual * cantidad;
    const gananciaPesos = valuacionActual - costoBruto;
    const gananciaPorcentaje = ((precioActual - precioCompra) / precioCompra) * 100;
    const enGanancia = gananciaPesos >= 0;

    return {
      costoBruto: Math.round(costoBruto),
      valuacionActual: Math.round(valuacionActual),
      gananciaPesos: Math.round(gananciaPesos),
      gananciaPorcentaje: parseFloat(gananciaPorcentaje.toFixed(2)),
      enGanancia,
      resumen: enGanancia
        ? `Ganancia de $${Math.round(gananciaPesos).toLocaleString("es-AR")} ARS (+${gananciaPorcentaje.toFixed(2)}%)`
        : `Pérdida de $${Math.abs(Math.round(gananciaPesos)).toLocaleString("es-AR")} ARS (${gananciaPorcentaje.toFixed(2)}%)`,
    };
  },
});
```

### Tool 4: `explicarDecision` (razonamiento explícito)

> Esta tool es el diferenciador clave. Fuerza al modelo a razonar antes de hacer una recomendación, evitando respuestas impulsivas y reduciendo alucinaciones.

```typescript
// lib/tools/explicar-decision.ts
import { tool } from "ai";
import { z } from "zod";

export const explicarDecision = tool({
  description:
    "Genera un análisis estructurado de una decisión financiera con pros, contras y nivel de riesgo. Usala SIEMPRE antes de dar una recomendación al usuario sobre comprar, vender o mantener un activo.",
  parameters: z.object({
    accion: z.enum(["comprar", "vender", "mantener"]),
    ticker: z.string(),
    razonamiento: z
      .string()
      .describe("El razonamiento completo detrás de la recomendación"),
    pros: z.array(z.string()).describe("Lista de razones a favor"),
    contras: z.array(z.string()).describe("Lista de riesgos o razones en contra"),
    nivelRiesgo: z.enum(["bajo", "medio", "alto"]),
    advertencia: z
      .string()
      .optional()
      .describe("Advertencia regulatoria si aplica"),
  }),
  execute: async (params) => {
    console.log(`[Tool] explicarDecision → ${params.accion} ${params.ticker}`);

    return {
      ...params,
      advertencia:
        params.advertencia ??
        "Esto no constituye asesoramiento financiero profesional. Consultá con un asesor habilitado antes de operar.",
    };
  },
});
```

---

## Paso 4 — El Endpoint Principal (`app/api/chat/route.ts`)

```typescript
// app/api/chat/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai"; // o anthropic, según elección
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { consultarMiCartera } from "@/lib/tools/consultar-mi-cartera";
import { consultarPrecioMercado } from "@/lib/tools/consultar-precio-mercado";
import { calcularMetricas } from "@/lib/tools/calcular-metricas";
import { explicarDecision } from "@/lib/tools/explicar-decision";

export const maxDuration = 60; // Vercel Serverless: máximo 60s para el stream

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("No autorizado", { status: 401 });
  }

  const { messages } = await req.json();

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
    maxSteps: 5, // Máximo de pasos encadenados que puede dar el agente
    onStepFinish({ stepType, toolCalls, toolResults }) {
      // Log de depuración en terminal durante desarrollo
      if (stepType === "tool-result") {
        console.log("[Agente] Tool results:", JSON.stringify(toolResults, null, 2));
      }
    },
  });

  return result.toDataStreamResponse();
}
```

---

## Paso 5 — Frontend del Chat (`app/(chat)/page.tsx`)

```typescript
// app/(chat)/page.tsx
"use client";

import { useChat } from "ai/react";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      // Mostrar steps intermedios (tool calls) al usuario
      experimental_toolCallStreaming: true,
    });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <p className="text-lg font-medium">¿En qué te ayudo hoy?</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {PREGUNTAS_SUGERIDAS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSubmit(undefined, { data: { input: p } })}
                  className="text-sm border rounded-full px-3 py-1.5 hover:bg-accent transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {/* Mostrar tool calls en progreso */}
              {m.toolInvocations?.map((tool) => (
                <div key={tool.toolCallId} className="text-xs text-muted-foreground mb-2 italic">
                  {tool.state === "call" && `Consultando ${tool.toolName}...`}
                  {tool.state === "result" && `✓ ${tool.toolName}`}
                </div>
              ))}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]"/>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]"/>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]"/>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-destructive">
            Error de conexión. Intentá de nuevo.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Preguntame sobre tu cartera o el mercado..."
          className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

const PREGUNTAS_SUGERIDAS = [
  "¿Cómo viene mi cartera hoy?",
  "¿A cuánto está AAPL en pesos?",
  "¿Conviene mantener o vender mis CEDEARs?",
  "¿Cuánto gané/perdí este mes?",
];
```

---

## 🔥 Flujo Completo — Ejemplo Real

**Usuario:** "¿Cómo viene mi posición en NVIDIA?"

```
1. route.ts recibe el mensaje y arma el contexto con el userId

2. LLM → llama a "consultarMiCartera" (userId)
   └── Retorna: { ticker: "NVDA", cantidad: 50, precioPromedio: 11200 }

3. LLM → llama a "consultarPrecioMercado" (ticker: "NVDA")
   └── Parser: "NVDA" → "NVDA.BA"
   └── Caché: MISS → consulta Yahoo → $13.480 ARS
   └── Guarda en caché por 5 minutos

4. LLM → llama a "calcularMetricas"
   └── Entrada: { precioCompra: 11200, precioActual: 13480, cantidad: 50 }
   └── Retorna: ganancia de $114.000 (+20.35%)

5. LLM → llama a "explicarDecision"
   └── Genera análisis estructurado antes de recomendar

6. LLM responde en stream al usuario:
   "Tu posición en NVIDIA viene muy bien 📈. Tenés 50 CEDEARs
    que compraste a $11.200 promedio y hoy cotizan a $13.480,
    eso es una ganancia de $114.000 pesos (+20,35%)..."
```

---

## ⚠️ Límites de Yahoo Finance — Estrategia Completa

| Situación | Comportamiento |
|-----------|---------------|
| Request normal | Yahoo responde → se guarda en caché 5 min |
| Misma acción en < 5 min | Devuelve caché → 0 requests a Yahoo |
| Error 429 (rate limit) | Catch específico → respuesta empática al usuario |
| Ticker inexistente | `regularMarketPrice` es null → mensaje claro |
| Error de red general | Catch genérico → sugerencia de reintentar |

**Para la hackathon (3 de mayo)**: el caché en Map es suficiente. El agente tiene `maxSteps: 5`, así que en el peor caso hace 5 requests a Yahoo en una conversación, lo cual está muy por debajo del límite.

**Para producción**: migrar el caché a Upstash Redis (1 línea de cambio en `market-cache.ts`) y evaluar `Alpha Vantage` o la API de IOL Invertir como fuente primaria, con Yahoo como fallback.

---

## 📦 Dependencias a Instalar

```bash
npm install ai @ai-sdk/openai yahoo-finance2 zod
```

Variables de entorno requeridas:

```env
OPENAI_API_KEY=sk-...
# o si usan AI Gateway de Vercel:
# AI_GATEWAY_URL=https://...
```

---

## ✅ Checklist de Entrega (Deadline: 3 de mayo)

- [ ] `lib/yahoo.ts` creado y configurado
- [ ] `lib/cache/market-cache.ts` creado
- [ ] Las 4 tools creadas en `lib/tools/`
- [ ] `app/api/chat/route.ts` con `streamText` y las tools
- [ ] System prompt con el userId inyectado
- [ ] Frontend del chat conectado al stream
- [ ] Preguntas sugeridas en el chat vacío
- [ ] Testeado con un ticker real (ej: AAPL, GGAL)
- [ ] Testeado con ticker inválido (ej: "XXXXXX")
- [ ] Variables de entorno cargadas en Vercel

---

## 🚀 Escalabilidad — Hoja de Ruta Post-Hackathon

| Componente | Hackathon | Producción |
|------------|-----------|------------|
| Caché | Map en memoria | Upstash Redis |
| Datos de mercado | yahoo-finance2 | API IOL / Alpha Vantage |
| Modelo LLM | GPT-4o | Fine-tuned o Claude 3.5 Sonnet |
| Tools adicionales | — | `ejecutarOrden`, `alertarPrecio`, `analizarSector` |
| Límite de requests | maxSteps: 5 | Rate limiting por userId |
