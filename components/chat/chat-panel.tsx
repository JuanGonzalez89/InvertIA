'use client';

import { Bot, Circle, Sparkles } from "lucide-react"
import { ChatMessage, ToolCallStream } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ToolCallPrice } from "./tool-calls/tool-call-price"
import { ToolCallContext } from "./tool-calls/tool-call-context"
import { ToolCallExecution } from "./tool-calls/tool-call-execution"
import { useState, useEffect, useRef } from "react";
import { useChat } from '@ai-sdk/react'

export function ChatPanel() {
  const { messages, sendMessage, error, status } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ role: 'user', content: input });
    setInput('');
  }

  const append = (message: any) => {
    sendMessage(message);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              Asistente financiero · gpt-5
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
          {messages.length === 0 && (
             <ChatMessage role="assistant">
              ¡Hola! Soy tu IA de InvertIA. ¿En qué te puedo ayudar hoy?
             </ChatMessage>
          )}

          {error && (
            <ChatMessage role="assistant">
              No pude responder por un problema del servidor. Verifica sesion activa y configuracion de base de datos en Vercel, luego intenta de nuevo.
            </ChatMessage>
          )}

          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role as "user" | "assistant"}>
               {m.content}
            </ChatMessage>
          ))}

          {status === "submitted" || status === "streaming" ? (
            <ChatMessage role="assistant">Estoy procesando tu consulta...</ChatMessage>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput input={input} handleInputChange={handleInputChange} handleSubmit={handleSubmit} append={append} />
    </section>
  )
}
