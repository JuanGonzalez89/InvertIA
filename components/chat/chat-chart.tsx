'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatARS } from "@/lib/utils";

interface ChatChartProps {
  ticker: string;
  data: Array<{ date: string; close: number }>;
}

export function ChatChart({ ticker, data }: ChatChartProps) {
  if (!data || data.length === 0) return null;

  const firstPrice = data[0].close;
  const lastPrice = data[data.length - 1].close;
  const isPositive = lastPrice >= firstPrice;
  const chartColor = isPositive ? "oklch(0.86 0.18 160)" : "oklch(0.66 0.22 22)";

  return (
    <Card className="my-2 border-border bg-background/50">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Evolución histórica: {ticker}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-md border border-border bg-background px-2 py-1 text-[10px] shadow-md">
                        <p className="font-bold">{formatARS(payload[0].value as number)}</p>
                        <p className="text-muted-foreground">
                          {new Date(payload[0].payload.date).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={chartColor}
                fillOpacity={1}
                fill="url(#colorPrice)"
                strokeWidth={2}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
