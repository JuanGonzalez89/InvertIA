"use client"

import { useState } from "react"
import { ArrowUp, Sparkles } from "lucide-react"
import { RgbButton } from "@/components/rgb-button"

const SUGGESTIONS = [
  "Rebalancear TX26",
  "Explicar caída de NVDA",
  "Consultar Liquidez",
]

export function ChatInput() {
  const [value, setValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    // TODO: wire to agent runner
    setValue("")
  }

  const handleSuggestion = (s: string) => {
    setValue(s)
  }

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur p-4">
      {/* Suggestion chips */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles className="h-3 w-3 text-muted-foreground" aria-hidden />
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSuggestion(s)}
            className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="agent-input" className="sr-only">
          Mensaje al agente
        </label>
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card focus-within:border-primary/50 transition-colors">
          <input
            id="agent-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Hablale al agente..."
            className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            autoComplete="off"
          />
          <div className="p-1.5">
            <RgbButton type="submit" aria-label="Enviar mensaje" className="h-9 w-9 p-0">
              <ArrowUp className="h-4 w-4" aria-hidden />
            </RgbButton>
          </div>
        </div>
      </form>
    </div>
  )
}
