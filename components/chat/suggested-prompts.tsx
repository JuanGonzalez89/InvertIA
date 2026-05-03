"use client"

import { useChat } from "@ai-sdk/react"

export function SuggestedPrompts({ prompts }: { prompts: string[] }) {
  const { sendMessage } = useChat()

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {prompts.map((p) => (
        <li key={p}>
          <button
            type="button"
            onClick={() => sendMessage({ text: p })}
            className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            {p}
          </button>
        </li>
      ))}
    </ul>
  )
}
