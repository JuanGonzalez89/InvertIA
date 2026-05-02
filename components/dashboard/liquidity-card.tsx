import Link from "next/link"
import { ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatARS } from "@/lib/utils"

interface LiquidityCardProps {
  liquidityARS: number
  totalCurrentValue: number
}

export function LiquidityCard({
  liquidityARS,
  totalCurrentValue,
}: LiquidityCardProps) {
  const pct = totalCurrentValue > 0 ? (liquidityARS / totalCurrentValue) * 100 : 0

  return (
    <section
      aria-labelledby="liquidity-title"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <h2
            id="liquidity-title"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Liquidez disponible
          </h2>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">ARS</span>
      </div>

      <div className="mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {formatARS(liquidityARS)}
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        Representa el{" "}
        <span className="text-primary">{pct.toFixed(1)}%</span> del total de tu
        cartera
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button asChild size="sm" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/movimientos#depositos">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Ingresar</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-9 border-border bg-transparent hover:bg-secondary">
          <Link href="/movimientos#retiros">
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Retirar</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-9 border-border bg-transparent hover:bg-secondary">
          <Link href="/mercado">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Comprar</span>
          </Link>
        </Button>
      </div>
    </section>
  )
}
