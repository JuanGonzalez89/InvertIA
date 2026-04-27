"use client"

import { Bell, Menu, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Mi cartera", href: "/cartera" },
  { label: "Mercado", href: "/mercado" },
  { label: "Movimientos", href: "/movimientos" },
  { label: "Chat IA", href: "/chat" },
  { label: "Perfil", href: "/perfil" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans text-base font-semibold tracking-tight text-foreground">
              InvertIA
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              AI Portfolio
            </span>
          </div>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <label className="relative w-full">
            <span className="sr-only">Buscar acciones, CEDEARs o bonos</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Buscar AAPL, NVDA, GGAL..."
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        {/* Nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Principal">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            <span
              aria-hidden
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary terminal-pulse"
            />
          </Button>

          <Link
            href="/perfil"
            className="flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 py-1 transition-colors hover:border-primary/40"
            aria-label="Perfil de Juan Pablo"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
              JP
            </span>
            <span className="hidden sm:inline text-sm font-medium text-foreground">
              Juan Pablo
            </span>
          </Link>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border bg-background p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="flex items-center gap-2.5 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </div>
                  <span className="font-sans text-base font-semibold tracking-tight">
                    InvertIA
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-3" aria-label="Navegación móvil">
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
