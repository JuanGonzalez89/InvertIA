import { Bot, Circle, Sparkles } from "lucide-react"
import { ChatMessage, ToolCallStream } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ToolCallPrice } from "./tool-calls/tool-call-price"
import { ToolCallContext } from "./tool-calls/tool-call-context"
import { ToolCallExecution } from "./tool-calls/tool-call-execution"

export function ChatPanel() {
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
          <ChatMessage role="assistant">
            Detecté movimientos relevantes en tu cartera. <span className="font-mono text-primary">NVDA</span> subió un{" "}
            <span className="text-primary">4,8%</span> y <span className="font-mono text-destructive">VIST</span> bajó un{" "}
            <span className="text-destructive">1,3%</span>. ¿Querés que analice tu cartera?
          </ChatMessage>

          <ChatMessage role="user">
            ¿Cómo ves a YPF hoy? ¿Me alcanza para comprar?
          </ChatMessage>

          <ToolCallStream>
            <ToolCallPrice ticker="YPF" price="$ 30.500" loading={false} />
            <ToolCallContext
              title="Buscando contexto vía MCP..."
              detail="Noticias recientes indican balances positivos en Vaca Muerta. Tenés $420.000 de liquidez, es viable."
              defaultOpen={false}
            />
          </ToolCallStream>

          <ChatMessage role="assistant">
            YPF cotiza a <span className="text-primary">$ 30.500</span>. Producción récord en Vaca Muerta y guidance positivo
            para Q4. Con <span className="text-primary">$ 420.000</span> de liquidez podés comprar hasta{" "}
            <span className="text-primary">13 acciones</span>.
          </ChatMessage>

          <ChatMessage role="user">
            Comprá 10 acciones por favor.
          </ChatMessage>

          <ToolCallStream>
            <ToolCallExecution cashDelta="− $ 305.000" positionDelta="+ 10 YPF" />
          </ToolCallStream>

          <ChatMessage role="assistant">
            Listo. Liquidez actual: <span className="text-primary">$ 115.000</span>.
          </ChatMessage>
        </div>
      </div>

      <ChatInput />
    </section>
  )
}
