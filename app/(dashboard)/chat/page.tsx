import { Bot } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ChatPanel } from "@/components/chat/chat-panel"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getPortfolio } from "@/lib/services/portfolio.service"
import { redirect } from "next/navigation"

export default async function ChatPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  // Cargamos los datos aquí, en el servidor, de forma plana
  const portfolio = await getPortfolio(user.id)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        eyebrow="Chat IA"
        title="AI Portfolio Manager"
        description="Analizá tu cartera y el mercado con nuestra inteligencia artificial financiera."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary terminal-pulse" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Online · Llama 3.3
            </span>
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Pasamos los datos directamente al componente de cliente */}
        <ChatPanel portfolio={portfolio} />
      </div>
    </div>
  )
}
