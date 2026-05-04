"use client"

import { useMemo, useState } from "react"
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

  const selectItem = (ticker: string) => {
    setOpen(false)
    setQuery("")
    router.push(`/activo/${encodeURIComponent(ticker)}`)
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
          <CommandList>
            {query.length > 0 && !filtered.some(i => i.ticker.toLowerCase() === query.toLowerCase()) && (
              <CommandGroup heading="Búsqueda global">
                <CommandItem onSelect={() => selectItem(query.toUpperCase())}>
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-sm font-semibold text-primary">{query.toUpperCase()}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Buscar en Yahoo Finance
                    </span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}

            <CommandEmpty>No encontramos sugerencias. Presioná Enter para buscar <b>{query}</b>.</CommandEmpty>

            <CommandGroup heading="Sugerencias del mercado">
              {filtered.map((item) => (
                <CommandItem key={item.ticker} onSelect={() => selectItem(item.ticker)}>
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
