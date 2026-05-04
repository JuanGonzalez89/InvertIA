import { PageHeader } from "@/components/dashboard/page-header";
import { AssetDetailView } from "@/components/dashboard/asset-detail-view";
import { LineChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ market?: string }>;
}) {
  const { ticker: rawTicker } = await params;
  const { market } = await searchParams;
  const ticker = decodeURIComponent(rawTicker);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        icon={LineChart}
        eyebrow="Detalle de activo"
        title={ticker}
      />
      <AssetDetailView ticker={ticker} market={market === "local" || market === "global" ? market : undefined} />
    </div>
  );
}
