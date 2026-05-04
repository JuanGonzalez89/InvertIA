'use client';

import { Bot, Sparkles, Lightbulb, Zap, ShieldCheck } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ChatChart } from "./chat-chart"
import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"

const CAPABILITIES = [
  { icon: Lightbulb, title: "Análisis contextual", desc: "Resumen de noticias y sentiment." },
  { icon: Zap, title: "Ejecución guiada", desc: "Compra y venta de activos." },
  { icon: ShieldCheck, title: "Datos privados", desc: "Tus operaciones están seguras." },
]

export function ChatPanel({ portfolio }: { portfolio?: any }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [localInput, setLocalInput] = useState("")
  
  // Usamos useChat de forma directa
  const chat = useChat({
    api: '/api/chat',
    body: { 
      portfolio_status: portfolio ? "updated" : "no_portfolio",
      portfolio_data: portfolio 
    },
    onError: (err: any) => setServerError("Error de la IA: " + err.message),
  })

  const isLoading = chat.status === "submitted" || chat.status === "streaming"
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat.messages, isLoading])

  /**
   * FUNCIÓN DE ENVÍO UNIVERSAL (ESTÁNDAR SENIOR)
   * No depende de 'append'. Usa el flujo de formulario nativo que es infalible.
   */
  const handleUniversalSend = async (text: string) => {
    if (!text.trim() || isLoading) return
    setServerError(null)

    // 1. Intentamos usar append si existe (más rápido)
    if (typeof chat.append === 'function') {
      try {
        await chat.append({ role: 'user', content: text.trim() })
        setLocalInput("")
        return
      } catch (e) {
        console.warn("Append falló, usando fallback de formulario...");
      }
    }

    // 2. Fallback de seguridad: Inyectamos y disparamos el evento de formulario
    // Esto funciona incluso si la SDK no ha terminado de cargar 'append'
    setLocalInput(text.trim())
    setTimeout(() => {
      if (typeof chat.handleSubmit === 'function') {
        chat.handleSubmit({ preventDefault: () => {} } as any)
        setLocalInput("")
      } else {
        setServerError("El chat todavía está cargando. Esperá 2 segundos...")
      }
    }, 100)
  }

  const suggestedPrompts = [
    "¿Cómo le fue a YPF el último mes?",
    "Comparar ALUA con TXAR (15 días)",
    "Analizá mi cartera",
    "Noticias de MELI",
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2 flex flex-col h-[650px] rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            InvertIA AI Assistant
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[9px] uppercase text-muted-foreground">En línea</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="space-y-6">
            {chat.messages.length === 0 && (
              <ChatMessage role="assistant">
                ¡Hola! Soy tu asistente de **InvertIA**. Analicemos tu cartera o el mercado. ¿Qué ticker querés consultar hoy?
              </ChatMessage>
            )}
            
            {serverError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                ⚠️ {serverError}
              </div>
            )}

            {chat.messages.map((m: any) => (
              <div key={m.id} className="flex flex-col gap-2">
                {m.content && <ChatMessage role={m.role}>{m.content}</ChatMessage>}
                {m.toolInvocations?.map((ti: any) => {
                  if (ti.toolName === 'getHistoricalPerformance' && ti.state === 'result' && ti.result?.data) {
                    return (
                      <div key={ti.toolCallId} className="ml-10 my-2">
                        <ChatChart ticker={ti.result.ticker} data={ti.result.data} />
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput
          input={localInput}
          handleInputChange={(e) => {
            setLocalInput(e.target.value)
            if (typeof chat.handleInputChange === 'function') {
              chat.handleInputChange(e)
            }
          }}
          handleSubmit={(e) => {
            e.preventDefault()
            handleUniversalSend(localInput)
          }}
          isLoading={isLoading}
        />
      </section>

      <aside className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Capacidades</h3>
          <ul className="space-y-4">
            {CAPABILITIES.map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{c.title}</div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Sugerencias</h3>
          <div className="flex flex-col gap-2">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleUniversalSend(p)}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-xs hover:border-primary/40 hover:bg-secondary/40 transition-all text-muted-foreground hover:text-primary"
              >
                {p}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}
