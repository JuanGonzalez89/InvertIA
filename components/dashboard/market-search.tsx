"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type SearchItem = {
  ticker: string
  name: string
  category: string
}

type RemoteSearchItem = {
  ticker: string
  name: string
  exchange?: string | null
  type?: string | null
  market?: "local" | "global"
}

type SearchScope = "both" | "local" | "global"

const ITEMS: SearchItem[] = [
  { ticker: "AAPL", name: "Apple Inc.", category: "CEDEAR" },
  { ticker: "MSFT", name: "Microsoft Corp.", category: "CEDEAR" },
  { ticker: "NVDA", name: "NVIDIA Corporation", category: "CEDEAR" },
  { ticker: "GOOGL", name: "Alphabet Inc.", category: "CEDEAR" },
  { ticker: "AMZN", name: "Amazon.com Inc.", category: "CEDEAR" },
  { ticker: "META", name: "Meta Platforms Inc.", category: "CEDEAR" },
  { ticker: "TSLA", name: "Tesla, Inc.", category: "CEDEAR" },
  { ticker: "MELI", name: "MercadoLibre, Inc.", category: "CEDEAR" },
  { ticker: "PEP", name: "Pepsico, Inc.", category: "CEDEAR" },
  { ticker: "KO", name: "Coca-Cola Co.", category: "CEDEAR" },
  { ticker: "BABA", name: "Alibaba Group", category: "CEDEAR" },
  { ticker: "NFLX", name: "Netflix, Inc.", category: "CEDEAR" },
  { ticker: "GGAL", name: "Grupo Financiero Galicia", category: "Acción" },
  { ticker: "YPFD", name: "YPF S.A.", category: "Acción" },
  { ticker: "PAMP", name: "Pampa Energía", category: "Acción" },
  { ticker: "ALUA", name: "Aluar", category: "Acción" },
  { ticker: "TXAR", name: "Ternium Argentina", category: "Acción" },
  { ticker: "VIST", name: "Vista Energy", category: "Acción" },
  { ticker: "TX26", name: "Bono TX26", category: "Bono" },
  { ticker: "AL30", name: "Bono AL30", category: "Bono" },
  { ticker: "GD30", name: "Bono GD30", category: "Bono" },
]

export function MarketSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<SearchScope>("both")
  const [remoteResults, setRemoteResults] = useState<RemoteSearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return ITEMS.slice(0, 8)

    return ITEMS.filter((item) => {
      return (
        item.ticker.toLowerCase().includes(needle) ||
        item.name.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle)
      )
    }).slice(0, 10)
  }, [query])

  useEffect(() => {
    const needle = query.trim()

    if (!needle) {
      setRemoteResults([])
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSearching(true)

      try {
        const response = await fetch(`/api/market/search?query=${encodeURIComponent(needle)}&scope=${scope}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setRemoteResults(Array.isArray(data?.results) ? data.results : [])
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          setRemoteResults([])
        }
      } finally {
        setIsSearching(false)
      }
    }, 220)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query, scope])

  useEffect(() => {
    if (!open) {
      setScope("both")
    }
  }, [open])

  const groupedRemoteResults = useMemo(() => {
    const seen = new Set<string>()
    const uniqueResults = remoteResults.filter((item) => {
      const key = item.ticker.toUpperCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })

    return {
      local: uniqueResults.filter((item) => item.market === "local"),
      global: uniqueResults.filter((item) => item.market === "global"),
      all: uniqueResults,
    }
  }, [remoteResults])

  const visibleRemoteResults = scope === "local"
    ? groupedRemoteResults.local
    : scope === "global"
      ? groupedRemoteResults.global
      : groupedRemoteResults.all

  const selectItem = (ticker: string, market?: "local" | "global") => {
    setOpen(false)
    setQuery("")
    const searchParams = market ? `?market=${market}` : ""
    router.push(`/activo/${encodeURIComponent(ticker)}${searchParams}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="hidden md:flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 text-left transition-colors hover:border-primary/50"
          aria-label="Buscar activos"
        >
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="font-mono text-sm text-muted-foreground">
            Buscar activos, CEDEARs o bonos...
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-xl p-0">
        <DialogTitle className="sr-only">Buscar activos</DialogTitle>
        <DialogDescription className="sr-only">
          Buscá CEDEARs, acciones de BCBA o bonos por ticker o nombre.
        </DialogDescription>
        <Command shouldFilter={false} className="rounded-lg border-0 shadow-none">
          <CommandInput
            placeholder="Escribí ticker o nombre"
            value={query}
            onValueChange={setQuery}
          />
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Mercado
            </span>
            <div className="inline-flex rounded-full border border-border bg-background/80 p-1 shadow-sm">
              {([
                { key: "both", label: "Ambos" },
                { key: "local", label: "Local" },
                { key: "global", label: "Global" },
              ] as const).map((option) => {
                const active = scope === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setScope(option.key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
          <CommandList>
            {query.length > 0 && visibleRemoteResults.length > 0 && scope !== "both" && (
              <CommandGroup heading={scope === "local" ? "Mercado local" : "Mercado global"}>
                {visibleRemoteResults.map((item) => (
                  <CommandItem key={`${item.ticker}-${item.name}`} onSelect={() => selectItem(item.ticker, item.market)}>
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Search className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex min-w-0 flex-col items-start">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-sm font-semibold text-primary">{item.ticker}</span>
                            <span className="rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {item.market === "local" ? "ARS" : "USD"}
                            </span>
                          </div>
                          <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query.length > 0 && visibleRemoteResults.length > 0 && scope === "both" && (
              <>
                {groupedRemoteResults.local.length > 0 && (
                  <CommandGroup heading="Mercado local">
                    {groupedRemoteResults.local.map((item) => (
                      <CommandItem key={`${item.ticker}-${item.name}`} onSelect={() => selectItem(item.ticker, item.market)}>
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Search className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex min-w-0 flex-col items-start">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-sm font-semibold text-primary">{item.ticker}</span>
                                <span className="rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                  ARS
                                </span>
                              </div>
                              <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {groupedRemoteResults.global.length > 0 && (
                  <CommandGroup heading="Mercado global">
                    {groupedRemoteResults.global.map((item) => (
                      <CommandItem key={`${item.ticker}-${item.name}`} onSelect={() => selectItem(item.ticker, item.market)}>
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Search className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex min-w-0 flex-col items-start">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-sm font-semibold text-primary">{item.ticker}</span>
                                <span className="rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                  USD
                                </span>
                              </div>
                              <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}

            <CommandEmpty>
              {isSearching
                ? "Buscando..."
                : `No encontramos sugerencias. Presioná Enter para buscar ${query}.`}
            </CommandEmpty>

            <CommandGroup heading="Sugerencias del mercado">
              {filtered.map((item) => (
                <CommandItem
                  key={item.ticker}
                  onSelect={() =>
                    selectItem(
                      item.ticker,
                      scope === "local" ? "local" : scope === "global" ? "global" : undefined
                    )
                  }
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm font-semibold">{item.ticker}</div>
                      <div className="text-xs text-muted-foreground">{item.name}</div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.category}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
