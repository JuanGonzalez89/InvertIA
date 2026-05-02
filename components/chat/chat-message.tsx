import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant"
  children: React.ReactNode
}

export function ChatMessage({ role, children }: ChatMessageProps) {
  const isUser = role === "user"
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
          isUser
            ? "border-primary/30 bg-primary/20 text-primary"
            : "border-border bg-secondary text-foreground",
        )}
        aria-hidden
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 font-mono text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function ToolCallStream({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary"
        aria-hidden
      >
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">{children}</div>
    </div>
  )
}
