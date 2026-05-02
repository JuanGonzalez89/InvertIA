"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { FileSpreadsheet, FileText, Sheet, Upload, CheckCircle2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { formatARS } from "@/lib/utils"

type ImportOption = {
  id: "csv" | "excel" | "google-sheets"
  label: string
  description: string
  hint: string
  icon: LucideIcon
}

type PreviewRow = {
  ticker: string
  quantity: number
  price: number
  type: "BUY" | "SELL"
}

const OPTIONS: ImportOption[] = [
  {
    id: "csv",
    label: "Importar CSV",
    description: "Archivo .csv exportado desde tu broker",
    hint: "Separador , o ;",
    icon: FileText,
  },
  {
    id: "excel",
    label: "Importar Excel",
    description: "Planilla .xlsx o .xls con tus tenencias",
    hint: "Hasta 10 MB",
    icon: FileSpreadsheet,
  },
  {
    id: "google-sheets",
    label: "Vincular Google Sheets",
    description: "Pegá el link de una planilla compartida",
    hint: "Solo lectura",
    icon: Sheet,
  },
]

function parseNumber(value: unknown) {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "")

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeRows(rows: Array<Record<string, unknown>>): PreviewRow[] {
  return rows
    .map((row) => {
      const ticker = String(row.ticker ?? row.symbol ?? row.codigo ?? row.activo ?? "")
        .toUpperCase()
        .trim()
      const quantity = parseNumber(row.quantity ?? row.qty ?? row.cantidad ?? row.cant)
      const price = parseNumber(row.price ?? row.precio ?? row.avgPrice ?? row.valor)
      const typeRaw = String(row.type ?? row.tipo ?? "BUY").toUpperCase().trim()
      const type = typeRaw === "SELL" ? "SELL" : "BUY"

      if (!ticker || quantity <= 0) {
        return null
      }

      return { ticker, quantity, price, type }
    })
    .filter((row): row is PreviewRow => row !== null)
}

function parseDelimitedText(text: string): PreviewRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const separator = lines[0].includes(";") ? ";" : ","
  const headers = lines[0].split(separator).map((header) => header.trim().toLowerCase())

  const rows = lines.slice(1).map((line) => {
    const cols = line.split(separator).map((column) => column.trim())
    return headers.reduce<Record<string, unknown>>((accumulator, header, index) => {
      accumulator[header] = cols[index] ?? ""
      return accumulator
    }, {})
  })

  return normalizeRows(rows)
}

function extractGoogleSheetsId(url: string) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match?.[1] ?? null
}

export function ImportPortfolio() {
  const router = useRouter()
  const csvRef = React.useRef<HTMLInputElement>(null)
  const xlsxRef = React.useRef<HTMLInputElement>(null)
  const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([])
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [sourceLabel, setSourceLabel] = React.useState<string>("")
  const [sheetDialogOpen, setSheetDialogOpen] = React.useState(false)
  const [sheetUrl, setSheetUrl] = React.useState("")

  const openFilePicker = (kind: "csv" | "excel") => {
    if (kind === "csv") {
      csvRef.current?.click()
    } else {
      xlsxRef.current?.click()
    }
  }

  const loadRows = async (rows: PreviewRow[], label: string) => {
    if (rows.length === 0) {
      toast.error("No encontramos filas válidas para importar")
      return
    }

    setSourceLabel(label)
    setPreviewRows(rows)
    setPreviewOpen(true)
  }

  const handleFile = async (file?: File | null) => {
    if (!file) return

    const lowerName = file.name.toLowerCase()

    try {
      if (lowerName.endsWith(".csv") || lowerName.endsWith(".txt")) {
        const text = await file.text()
        await loadRows(parseDelimitedText(text), file.name)
        return
      }

      if (lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx")) {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          toast.error("El Excel no tiene hojas")
          return
        }

        const worksheet = workbook.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" })
        await loadRows(normalizeRows(rawRows), file.name)
        return
      }

      toast.error("Formato no soportado. Usá CSV, XLSX o Google Sheets.")
    } catch (error) {
      console.error(error)
      toast.error("No pudimos leer el archivo")
    }
  }

  const handleGoogleSheets = async () => {
    const trimmedUrl = sheetUrl.trim()
    if (!trimmedUrl) {
      toast.error("Pegá un link válido de Google Sheets")
      return
    }

    const sheetId = extractGoogleSheetsId(trimmedUrl)
    if (!sheetId) {
      toast.error("No pude detectar el ID de la planilla")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/import/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: trimmedUrl }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.error ?? "No pudimos leer la planilla")
      }

      const payload = await response.json()
      await loadRows(parseDelimitedText(payload.csvText), "Google Sheets")
      setSheetDialogOpen(false)
      setSheetUrl("")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "No pudimos conectar la planilla")
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = async () => {
    setLoading(true)
    try {
      // TODO: merge por ticker (sumar cantidades y promediar precios) antes de enviar, sin duplicar filas.
      const response = await fetch("/api/import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: previewRows }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Error importando datos")
      }

      toast.success(`Importamos ${payload.processed ?? previewRows.length} filas`)
      setPreviewOpen(false)
      setPreviewRows([])
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "No pudimos importar la cartera")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="importar"
      aria-labelledby="import-title"
      className="rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <Upload className="h-3.5 w-3.5" aria-hidden />
            <span>Cargar activos</span>
          </div>
          <h2
            id="import-title"
            className="text-pretty text-lg font-semibold tracking-tight text-foreground"
          >
            Importá tu cartera actual
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            InvertIA no se conecta a tu broker. Cargá tus tenencias actuales desde un
            archivo o planilla y nosotros las analizamos.
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 self-start rounded-full border border-border bg-secondary/40 px-3 py-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-primary terminal-pulse" aria-hidden />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Sin credenciales bancarias
          </span>
        </div>
      </header>

      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => {
                  if (opt.id === "google-sheets") {
                    setSheetDialogOpen(true)
                    return
                  }

                  openFilePicker(opt.id)
                }}
                className="group relative flex h-full w-full flex-col items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">
                    {opt.label}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-auto flex w-full items-center justify-between pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {opt.hint}
                  </span>
                  <span className="font-mono text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Seleccionar →
                  </span>
                </div>
              </button>
            </li>
          )
        })}
        <input
          ref={csvRef}
          type="file"
          accept="text/csv,application/csv,text/plain"
          className="hidden"
          onChange={async (event) => {
            await handleFile(event.target.files?.[0] ?? null)
            event.target.value = ""
          }}
          onClick={(event) => {
            event.currentTarget.value = ""
          }}
        />
        <input
          ref={xlsxRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={async (event) => {
            await handleFile(event.target.files?.[0] ?? null)
            event.target.value = ""
          }}
          onClick={(event) => {
            event.currentTarget.value = ""
          }}
        />
      </ul>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Previsualizar importación</DialogTitle>
            <DialogDescription>
              Revisá los registros detectados en {sourceLabel} antes de guardarlos.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Ticker</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={`${row.ticker}-${index}`} className="border-t border-border">
                    <td className="px-3 py-2 font-mono font-semibold">{row.ticker}</td>
                    <td className="px-3 py-2 tabular-nums">{row.quantity}</td>
                    <td className="px-3 py-2 tabular-nums">{formatARS(row.price)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={row.type === "BUY" ? "default" : "destructive"}>
                        {row.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={confirmImport} disabled={loading}>
              <CheckCircle2 className="h-4 w-4" />
              Importar {previewRows.length} filas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sheetDialogOpen} onOpenChange={setSheetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar Google Sheets</DialogTitle>
            <DialogDescription>
              Pegá un link público de la planilla para convertirla en importación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              placeholder="https://docs.google.com/spreadsheets/..."
              value={sheetUrl}
              onChange={(event) => setSheetUrl(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              La planilla tiene que estar compartida con acceso de lectura.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSheetDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleGoogleSheets} disabled={loading}>
              <Sheet className="h-4 w-4" />
              Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
