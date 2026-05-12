"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatARS } from "@/lib/utils";

interface RendimientoChartProps {
  chartPoints: { date: string; close: number }[];
}

export function RendimientoChart({ chartPoints }: RendimientoChartProps) {
  if (!chartPoints || chartPoints.length === 0) {
    return <div className="text-xs text-muted-foreground text-center mt-8">Sin historial suficiente para graficar.</div>;
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartPoints} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value) => new Date(value).toLocaleDateString("es-AR", { month: "short", year: "2-digit" })}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={60}
            tickFormatter={(value) => formatARS(Number(value))}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-md border border-border bg-background px-2 py-1 text-[10px] shadow-md">
                    <p className="font-bold">{formatARS(payload[0].value as number)}</p>
                    <p className="text-muted-foreground">{new Date(payload[0].payload.date).toLocaleDateString("es-AR")}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#16a34a"
            fillOpacity={0.14}
            fill="#16a34a"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
