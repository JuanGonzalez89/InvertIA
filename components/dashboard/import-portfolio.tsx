"use client"

import React from "react"
import { FileSpreadsheet, FileText, Sheet, Upload } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type ImportOption = {
  id: "csv" | "excel" | "google-sheets"
  label: string
  description: string
  hint: string
  icon: LucideIcon
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

export function ImportPortfolio() {
  const csvRef = React.createRef<HTMLInputElement>()
  const xlsxRef = React.createRef<HTMLInputElement>()

  const handleSelect = (id: string) => {
    if (id === 'csv') csvRef.current?.click()
    if (id === 'excel') xlsxRef.current?.click()
    if (id === 'google-sheets') {
      const url = window.prompt('Pega el link público de Google Sheets')
      if (url) {
        console.log('Google Sheets URL:', url)
        // TODO: procesar link en backend
        alert('Link recibido — procesalo en el backend (pendiente)')
      }
    }
  }

  const handleFile = async (file?: File | null) => {
    if (!file) return
    console.log('Selected file', file.name, file.size)
    // TODO: subir a API para procesar
    alert(`Archivo seleccionado: ${file.name}`)
  }

  return (
    <section
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
                onClick={() => handleSelect(opt.id)}
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
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={xlsxRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </ul>
    </section>
  )
}
