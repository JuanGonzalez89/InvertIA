import { PageHeader } from "@/components/dashboard/page-header";
import { AssetDetailView } from "@/components/dashboard/asset-detail-view";
import { LineChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AssetDetailPage({ params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        icon={LineChart}
        eyebrow="Detalle de activo"
        title={ticker}
        description="Vista estilo Yahoo Finance con datos frescos, histórico y CCL implícito."
      />
      <AssetDetailView ticker={ticker} />
    </div>
  );
}
