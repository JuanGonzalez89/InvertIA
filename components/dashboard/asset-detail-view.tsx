'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, BarChart3, Building2, CalendarRange, Loader2, RefreshCw } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatARS, formatPercent } from "@/lib/utils";
import type { AssetDetailData, AssetDetailRange } from "@/lib/services/asset-detail.service";

type AssetDetailViewProps = {
  ticker: string;
};

const RANGE_OPTIONS: AssetDetailRange[] = ["1D", "1M", "6M", "1Y", "5Y"];

function formatDateLabel(dateISO: string, range: AssetDetailRange) {
  const date = new Date(dateISO);

  if (range === "1D") {
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function formatCompactNumber(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("es-AR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-8 w-52 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
          <div className="h-10 w-28 rounded bg-muted" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="h-[360px] rounded-lg bg-muted/50" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-border bg-card p-4" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-muted/80" />
          <div className="h-3 w-11/12 rounded bg-muted/80" />
          <div className="h-3 w-10/12 rounded bg-muted/80" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-lg font-semibold tabular-nums text-foreground">
          {value}
        </div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  )
}

export function AssetDetailView({ ticker }: AssetDetailViewProps) {
  const [range, setRange] = useState<AssetDetailRange>("1M")
  const [data, setData] = useState<AssetDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDetail() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/asset-detail?ticker=${encodeURIComponent(ticker)}&range=${range}`,
          { signal: controller.signal, cache: "no-store" }
        )

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error ?? "No se pudo cargar el activo")
        }

        const payload = (await response.json()) as AssetDetailData
        setData(payload)
      } catch (fetchError: any) {
        if (fetchError?.name !== "AbortError") {
          setError(fetchError?.message ?? "No se pudo cargar el activo")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()

    return () => controller.abort()
  }, [ticker, range, reloadKey])

  const chartData = useMemo(() => {
    return (data?.chartPoints ?? []).map((point) => ({
      date: point.date,
      price: point.close,
    }))
  }, [data])

  const isPositive = (data?.dailyChangePercent ?? 0) >= 0
  const changeClass = isPositive ? "text-emerald-500" : "text-red-500"
  const changeBg = isPositive ? "bg-emerald-500/10" : "bg-red-500/10"

  const chartColor = isPositive ? "oklch(0.86 0.18 160)" : "oklch(0.66 0.22 22)"

  if (isLoading && !data) {
    return <DetailSkeleton />
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="text-sm text-red-500">{error}</div>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary/40"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Vista de detalle del activo
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {data.ticker}
                </h1>
                <span className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {data.companyName}
                </span>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {data.about}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Precio actual
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatARS(data.currentPriceARS)}
            </div>
            <div className={cn("mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-sm tabular-nums", changeBg, changeClass)}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {`${data.dailyChangeARS >= 0 ? "+" : ""}${formatARS(data.dailyChangeARS)} (${data.dailyChangePercent >= 0 ? "+" : ""}${formatPercent(data.dailyChangePercent)})`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          {RANGE_OPTIONS.map((option) => {
            const active = option === range
            return (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                  active
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {option}
              </button>
            )
          })}
          <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            {data.chartLabel}
          </div>
        </div>

        <div className="p-5">
          <ChartContainer
            config={{
              price: {
                label: "Precio",
                color: chartColor,
              },
            }}
            className="h-[360px] w-full"
          >
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value) => formatDateLabel(value, range)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={70}
                tickFormatter={(value) => formatARS(Number(value))}
              />
              <ChartTooltip
                cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => {
                      const numeric = Number(value)
                      return formatARS(numeric)
                    }}
                    labelFormatter={(label) => formatDateLabel(String(label), range)}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--color-price)"
                fill="var(--color-price)"
                fillOpacity={0.14}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Rango 52 semanas"
          value={`${formatARS(data.week52Low ?? 0)} - ${formatARS(data.week52High ?? 0)}`}
          hint="Mínimo y máximo del último año"
        />
        <MetricCard
          label="Volumen"
          value={formatCompactNumber(data.volume)}
          hint="Volumen operado en la jornada"
        />
        <MetricCard
          label="Precio subyacente (USD)"
          value={data.underlyingPriceUSD ? `$${data.underlyingPriceUSD.toFixed(2)}` : "—"}
          hint={data.underlyingTicker ? `Ticker subyacente: ${data.underlyingTicker}` : "No disponible"}
        />
        <MetricCard
          label="Ratio CEDEAR"
          value={data.cedearRatio ? `1:${data.cedearRatio}` : "—"}
          hint={data.cedearRatioSource === "db" ? "Leído desde la base" : data.cedearRatioSource === "fallback" ? "Estimado desde catálogo local" : "No configurado"}
        />
        <MetricCard
          label="Dólar CCL implícito"
          value={data.impliedCCL ? `$${data.impliedCCL.toFixed(2)}` : "—"}
          hint="(Precio CEDEAR x ratio) / subyacente USD"
        />
        <MetricCard
          label="Variación diaria"
          value={`${data.dailyChangeARS >= 0 ? "+" : ""}${formatARS(data.dailyChangeARS)} (${data.dailyChangePercent >= 0 ? "+" : ""}${formatPercent(data.dailyChangePercent)})`}
          hint="Movimiento del último cierre"
        />
        <MetricCard
          label="Ticker"
          value={data.ticker}
          hint={data.isCedear ? "CEDEAR" : "Activo local"}
        />
        <MetricCard
          label="Última actualización"
          value={new Date(data.lastUpdated).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          hint="Datos frescos desde Yahoo Finance"
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          About / Perfil
        </div>
        <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
          {data.about}
        </p>
      </section>

      <section className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4">
        <Link href="/mercado" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver al mercado
        </Link>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-sm text-foreground hover:bg-secondary/40"
        >
          <RefreshCw className="h-4 w-4" />
          Refrescar datos
        </button>
      </section>
    </div>
  )
}
