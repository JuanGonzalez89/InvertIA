import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  TrendingUp,
  Brain,
  Shield,
  BarChart3,
  Wallet,
  Bot,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Activity,
  Zap,
  LineChart,
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "IA Avanzada",
    description:
      "Análisis predictivo con machine learning entrenado en el mercado argentino",
  },
  {
    icon: TrendingUp,
    title: "Datos en Tiempo Real",
    description:
      "Cotizaciones de acciones, CEDEARs, bonos y dólar actualizados al instante",
  },
  {
    icon: Shield,
    title: "Gestión de Riesgo",
    description:
      "Alertas inteligentes y análisis de volatilidad para proteger tu capital",
  },
  {
    icon: Wallet,
    title: "Portfolio Tracker",
    description: "Seguí tu cartera con métricas avanzadas y rendimiento histórico",
  },
  {
    icon: BarChart3,
    title: "Análisis Técnico",
    description:
      "Indicadores, patrones y señales de trading automatizadas",
  },
  {
    icon: Bot,
    title: "Chat con IA",
    description:
      "Consultá dudas sobre inversiones con nuestro asistente inteligente",
  },
]

const stats = [
  { value: "50+", label: "Activos analizados", icon: LineChart },
  { value: "24/7", label: "Monitoreo continuo", icon: Activity },
  { value: "99.9%", label: "Uptime garantizado", icon: Zap },
  { value: "1000+", label: "Usuarios activos", icon: TrendingUp },
]

const tickers = [
  { symbol: "GGAL", price: "4.850", change: "+2.34%" },
  { symbol: "YPF", price: "22.15", change: "+1.87%" },
  { symbol: "MELI", price: "1,892", change: "+0.45%" },
  { symbol: "USD/ARS", price: "1,150", change: "-0.12%" },
  { symbol: "AL30", price: "68.25", change: "+3.21%" },
]

export function LandingPage() {
  return (
    <div className="space-y-16 pb-8">
      <section className="border-b border-border bg-card/50 overflow-hidden rounded-xl">
        <div className="ticker-marquee-track flex items-center gap-8 py-2 px-4">
          {[...tickers, ...tickers].map((ticker, index) => (
            <div key={`${ticker.symbol}-${index}`} className="flex items-center gap-3 whitespace-nowrap">
              <span className="font-mono text-sm text-muted-foreground">{ticker.symbol}</span>
              <span className="font-mono text-sm font-medium text-foreground">${ticker.price}</span>
              <span className={`font-mono text-sm ${ticker.change.startsWith("+") ? "text-success" : "text-destructive"}`}>
                {ticker.change}
              </span>
              <span className="text-border">|</span>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-border bg-card/40 px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[140px]" />
          <div className="absolute right-1/4 top-1/3 h-[360px] w-[360px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.04] terminal-grid" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="h-4 w-4 text-primary opacity-50" />
              </div>
            </div>
            <span className="font-medium text-primary">Potenciado por Inteligencia Artificial</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Invertí de forma{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">inteligente</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path
                  d="M2 10C50 2 150 2 198 10"
                  stroke="oklch(0.85 0.18 165)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
            </span>
            <br />
            <span className="text-muted-foreground">en el mercado argentino</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Gestioná tu cartera con análisis de IA, datos en tiempo real y herramientas
            profesionales diseñadas para el inversor argentino.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full bg-primary px-8 text-base text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 sm:w-auto">
              <Link href="/sign-up">
                Ver demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-border text-base hover:border-primary/50 hover:bg-muted sm:w-auto">
              <Link href="/sign-in">
                Ya tengo cuenta
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Sin tarjeta de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Setup en 2 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Cancelá cuando quieras
            </span>
          </div>
        </div>
      </section>

      <section id="stats" className="rounded-2xl border border-border bg-card/30">
        <div className="px-4 py-10 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative flex flex-col items-center rounded-xl p-4 text-center transition-all hover:bg-muted/50"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary/20">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="font-mono text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="space-y-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            Features
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Todo lo que necesitás para{" "}
            <span className="text-primary">invertir mejor</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Herramientas profesionales de nivel institucional, accesibles para todos
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border bg-card/50 p-6 transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <Card className="relative overflow-hidden border-border bg-card p-1">
          <div className="flex items-center gap-2 rounded-t-lg border-b border-border bg-muted/50 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive/70" />
              <div className="h-3 w-3 rounded-full bg-[oklch(0.80_0.12_80)]/70" />
              <div className="h-3 w-3 rounded-full bg-[oklch(0.78_0.18_152)]/70" />
            </div>
            <span className="ml-4 font-mono text-xs text-muted-foreground">InvertIA Terminal v1.0</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="terminal-pulse h-2 w-2 rounded-full bg-success" />
              <span className="font-mono text-xs text-success">LIVE</span>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 text-xs font-mono uppercase text-muted-foreground">Portfolio Value</div>
                <div className="text-2xl font-mono font-bold text-primary">$24,850.00</div>
                <div className="text-sm font-mono text-success">+$1,234.56 (+5.2%)</div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 text-xs font-mono uppercase text-muted-foreground">Today's P&amp;L</div>
                <div className="text-2xl font-mono font-bold text-success">+$342.18</div>
                <div className="text-sm font-mono text-muted-foreground">12 operaciones</div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 text-xs font-mono uppercase text-muted-foreground">AI Confidence</div>
                <div className="text-2xl font-mono font-bold text-primary">87%</div>
                <div className="text-sm font-mono text-muted-foreground">Mercado alcista</div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3 font-mono text-sm">
              <span className="text-primary">$</span>
              <span className="ml-2 text-muted-foreground">invertia analyze --ticker GGAL --period 30d</span>
              <span className="ml-1 animate-pulse text-primary">|</span>
            </div>
          </div>
        </Card>
      </section>

      <section id="cta">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Empezá a invertir con{" "}
              <span className="text-primary">inteligencia</span> hoy
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Unite a miles de inversores argentinos que ya usan InvertIA para tomar mejores decisiones financieras.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-primary px-8 text-base text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90">
                <Link href="/sign-up">
                  Empezar ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/sign-in">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}