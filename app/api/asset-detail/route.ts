import { NextResponse } from "next/server";
import { getAssetDetailData, type AssetDetailRange } from "@/lib/services/asset-detail.service";

export const dynamic = "force-dynamic";

const VALID_RANGES: AssetDetailRange[] = ["1D", "1M", "6M", "1Y", "5Y"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.trim();
  const range = searchParams.get("range")?.trim().toUpperCase() as AssetDetailRange | undefined;

  if (!ticker) {
    return NextResponse.json({ error: "Ticker requerido" }, { status: 400 });
  }

  const selectedRange = VALID_RANGES.includes(range as AssetDetailRange)
    ? (range as AssetDetailRange)
    : "1M";

  try {
    const data = await getAssetDetailData(ticker, selectedRange);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[AssetDetailAPI] Failed to build detail payload", error);
    return NextResponse.json(
      { error: "No se pudo cargar el detalle del activo" },
      { status: 500 }
    );
  }
}
