"use client"

import { Line, LineChart, ResponsiveContainer } from "recharts"

interface SparklineProps {
  data: number[]
  positive?: boolean
  className?: string
}

export function Sparkline({ data, positive = true, className }: SparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }))
  const stroke = positive ? "oklch(0.85 0.18 165)" : "oklch(0.65 0.22 22)"

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
