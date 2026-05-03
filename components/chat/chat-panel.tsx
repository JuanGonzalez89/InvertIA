'use client';

import { Bot, Circle, Sparkles } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { useState, useEffect, useRef, type FormEvent } from "react"
import { useChat } from "@ai-sdk/react"

export function ChatPanel({ portfolio }: { portfolio?: any }) {
  const [input, setInput] = useState("")
  
  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat()
  
  const isLoading = status === "submitted" || status === "streaming"
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedPrompts = [
    "¿Cómo viene mi cartera hoy?",
    "Analizá mis CEDEARs",
    "¿Cuál es el Dólar Cable (CCL) implícito de mis activos?",
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value)
  }

  const handleSafeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) {
      return
    }
    // Pass the body in the sendMessage options
    sendMessage({ role: "user", parts: [{ type: 'text', text: input }] } as any, { body: { cartera: portfolio } })
    setInput("")
  }

  const append = (msg: any) => {
    sendMessage({ role: msg.role, parts: [{ type: 'text', text: msg.content }] } as any, { body: { cartera: portfolio } })
  }

  return (
    <section
      id="chat"
      aria-label="AI Portfolio Manager"
      className="flex h-[640px] flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Chat header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Bot className="h-4 w-4" aria-hidden />
            <Sparkles className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-primary" aria-hidden />
          </div>
          <div className="flex flex-col leading-none">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              AI Portfolio Manager
            </h2>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              Asistente financiero · gpt-4o
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1">
          <Circle className="h-1.5 w-1.5 fill-primary text-primary terminal-pulse" aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Online
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 py-4">
          {messages.length === 0 && !error && (
            <div className="rounded-lg border border-dashed border-border bg-background/40 p-4">
              <ChatMessage role="assistant">
                ¡Hola! Soy tu IA de InvertIA. ¿En qué te puedo ayudar hoy?
              </ChatMessage>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Sugerencias para empezar
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => append({ role: "user", content: prompt })}
                      className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <ChatMessage role="assistant">
              No pude responder por un problema del servidor. Verifica sesion activa y configuracion de base de datos en Vercel, luego intenta de nuevo.
            </ChatMessage>
          )}

          {messages.map((m: any) => (
            <ChatMessage key={m.id} role={m.role as "user" | "assistant"}>
              {m.parts ? m.parts.map((p: any) => p.type === 'text' ? p.text : '').join('') : m.content}
            </ChatMessage>
          ))}

          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Escribiendo</span>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSafeSubmit}
        isLoading={isLoading}
      />
    </section>
  )
}
