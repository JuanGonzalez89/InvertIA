"use client"

import { useState } from "react"
import { ChevronDown, Sparkles, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToolCallContextProps {
  title: string
  detail: string
  defaultOpen?: boolean
}

/**
 * Tool Call: decision-explainer / context lookup via MCP.
 * Expandable card; `detail` is shown when expanded.
 */
export function ToolCallContext({
  title,
  detail,
  defaultOpen = false,
}: ToolCallContextProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-border bg-card/80 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent/30 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              tool · mcp_context_lookup
            </span>
            <Check className="h-3 w-3 text-primary" aria-hidden />
          </div>
          <p className="mt-1 font-mono text-sm text-foreground">{title}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform mt-1",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border px-3 py-3 pl-[2.875rem]">
            <p className="font-mono text-[12px] leading-relaxed text-muted-foreground">
              {detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
