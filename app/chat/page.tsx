import { Bot, Lightbulb, ShieldCheck, Zap } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ChatPanel } from "@/components/chat/chat-panel"
import { SuggestedPrompts } from "@/components/chat/suggested-prompts"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getPortfolio } from "@/lib/services/portfolio.service"

const CAPABILITIES = [
  {
    icon: Lightbulb,
    title: "Análisis contextual",
    desc: "Resumen de noticias, fundamentals y sentimiento del mercado.",
  },
  {
    icon: Zap,
    title: "Ejecución guiada",
    desc: "Compra y venta de activos con confirmación en lenguaje natural.",
  },
  {
    icon: ShieldCheck,
    title: "Datos privados",
    desc: "Tus operaciones y cartera nunca salen de tu cuenta.",
  },
]

const PROMPTS = [
  "¿Cómo viene mi cartera hoy?",
  "Analizá mis CEDEARs",
  "¿Cuál es el Dólar Cable (CCL) implícito de mis activos?",
]

export default function ChatPage() {
  return (
    <div>
      <PageHeader
        icon={Bot}
        eyebrow="Chat IA"
        title="AI Portfolio Manager"
        description="Tu asistente financiero impulsado por IA: análisis, contexto de mercado y ejecución de operaciones en lenguaje natural."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary terminal-pulse" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Online · gpt-4o
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Fetch portfolio server-side and pass serializable data to the ChatPanel */}
          {/* Note: getCurrentUser and getPortfolio execute on the server */}
          <AsyncChatPanel />
        </div>

        <aside className="space-y-6" aria-label="Capacidades y sugerencias">
          <section
            aria-labelledby="caps-title"
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2
              id="caps-title"
              className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Qué puede hacer
            </h2>
            <ul className="mt-4 space-y-4">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon
                return (
                  <li key={c.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-foreground">
                        {c.title}
                      </div>
                      <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
                        {c.desc}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section
            aria-labelledby="prompts-title"
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2
              id="prompts-title"
              className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Sugerencias para empezar
            </h2>
            {/* Client-side suggested prompts that append to the chat via useChat */}
            <div className="mt-3">
              {/* @ts-ignore Async server -> client */}
              <SuggestedPrompts prompts={PROMPTS} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

async function AsyncChatPanel() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Iniciá sesión para acceder al chat y enlazar tu cartera.</p>
      </div>
    )
  }

  const portfolio = await getPortfolio(user.id)

  // ChatPanel is a client component; pass portfolio as serializable prop
  // so the client-side `useChat` hook can receive it and inject into requests.
  // @ts-ignore-next-line ServerComponent
  return <ChatPanel portfolio={portfolio} />
}
