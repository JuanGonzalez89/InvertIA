"use client"

import { ArrowUp } from "lucide-react"
import { RgbButton } from "@/components/rgb-button"

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {
  return (
    <div className="border-t border-border bg-background/80 backdrop-blur p-4">
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="agent-input" className="sr-only">
          Mensaje al agente
        </label>
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card focus-within:border-primary/50 transition-colors">
          <input
            id="agent-input"
            value={input}
            onChange={handleInputChange}
            placeholder="Hablale al agente..."
            className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            autoComplete="off"
            disabled={isLoading}
          />
          <div className="p-1.5">
            <RgbButton
              type="submit"
              aria-label="Enviar mensaje"
              disabled={!input?.trim() || isLoading}
              className="h-9 w-9 p-0 disabled:opacity-50"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </RgbButton>
          </div>
        </div>
      </form>
    </div>
  )
}

