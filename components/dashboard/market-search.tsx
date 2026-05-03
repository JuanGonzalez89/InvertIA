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
  { ticker: "AAPL", name: "Apple", category: "Acción" },
  { ticker: "MSFT", name: "Microsoft", category: "Acción" },
  { ticker: "NVDA", name: "NVIDIA", category: "Acción" },
  { ticker: "GOOGL", name: "Alphabet", category: "Acción" },
  { ticker: "AMZN", name: "Amazon", category: "Acción" },
  { ticker: "META", name: "Meta", category: "Acción" },
  { ticker: "TSLA", name: "Tesla", category: "Acción" },
  { ticker: "MELI", name: "MercadoLibre", category: "Acción" },
  { ticker: "GGAL", name: "Galicia", category: "BCBA" },
  { ticker: "VIST", name: "Vista Energy", category: "BCBA" },
  { ticker: "YPF", name: "YPF", category: "BCBA" },
  { ticker: "TX26", name: "Bono TX26", category: "Bono" },
]

export function MarketSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return ITEMS

    return ITEMS.filter((item) => {
      return [item.ticker, item.name, item.category].some((value) =>
        value.toLowerCase().includes(needle)
      )
    })
  }, [query])

  const selectItem = (ticker: string) => {
    setOpen(false)
    setQuery("")
    router.push(`/mercado?query=${encodeURIComponent(ticker)}`)
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
            <CommandEmpty>No encontramos coincidencias.</CommandEmpty>
            <CommandGroup heading="Sugerencias">
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
