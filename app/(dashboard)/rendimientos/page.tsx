import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPortfolio } from "@/lib/services/portfolio.service";
import { getAssetPerformanceSeries } from "@/lib/services/asset-detail.service";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatARS, formatPercent } from "@/lib/utils";
import { RendimientoChart } from "@/components/dashboard/rendimiento-chart";
import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RendimientosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const portfolio = await getPortfolio(user.id);
  const assets = portfolio.assets || [];

  // Para cada activo, traemos el historial de precios (último año)
  const assetsWithHistory = await Promise.all(
    assets.map(async (asset) => {
      const series = await getAssetPerformanceSeries(asset.ticker, "1Y", "local");
      return { ...asset, chartPoints: series.chartPoints };
    })
  );

  return (
    <>
      <PageHeader
        icon={BarChart3}
        eyebrow="Rendimientos"
        title="Performance histórica de tu cartera"
        description="Visualizá cómo evolucionó cada activo desde tu compra hasta hoy."
      />
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-6">
        {assetsWithHistory.map((asset) => (
          <Card key={asset.ticker} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {asset.ticker}
                  </div>
                  <div className="text-lg font-semibold text-foreground">{asset.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Valor inicial</div>
                  <div className="font-mono text-base">{formatARS(asset.investedValueArs)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Valor actual</div>
                  <div className="font-mono text-base">{formatARS(asset.currentValueArs)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className={`rounded-md px-2 py-1 font-mono text-xs ${asset.gainLossValueArs >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                  {asset.gainLossValueArs >= 0 ? "+" : ""}{formatARS(asset.gainLossValueArs)} ({asset.totalGainPercent >= 0 ? "+" : ""}{formatPercent(asset.totalGainPercent)})
                </div>
              </div>
              <RendimientoChart chartPoints={asset.chartPoints} />
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
