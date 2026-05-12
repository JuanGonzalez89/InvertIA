import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/prisma";
import { toBCBASymbol } from "@/lib/yahoo";
import { resolveAssetStorageSymbol, resolvePreferredQuoteMarket } from "@/lib/instrument";

type ImportRow = {
  ticker: string;
  quantity: number;
  price: number;
  type: "BUY" | "SELL";
  assetType?: "CEDEAR" | "ACCION" | "BONO" | "ETF" | "OTRO";
  currency?: "ARS" | "USD";
};

function normalizeAssetType(assetType?: ImportRow["assetType"]) {
  switch (assetType) {
    case "ACCION":
      return "STOCK" as const;
    case "BONO":
      return "BOND" as const;
    case "ETF":
      return "ETF" as const;
    case "CEDEAR":
    default:
      return "CEDEAR" as const;
  }
}

function normalizeCurrency(row: ImportRow) {
  const explicitCurrency = String(row.currency ?? "").toUpperCase().trim();
  if (explicitCurrency === "USD") return "USD" as const;
  if (explicitCurrency === "ARS") return "ARS" as const;

  return "ARS" as const;
}

function groupRows(rows: ImportRow[]) {
  // Agrupa por ticker y tipo, pero mantiene el precio de compra original (NO recalcula promedio)
  const grouped = new Map<string, ImportRow & { totalCost: number }>();

  for (const row of rows) {
    const ticker = String(row.ticker ?? "").toUpperCase().trim();
    if (!ticker || row.quantity <= 0) continue;

    const assetType = row.assetType ?? "CEDEAR";
    const key = `${ticker}::${assetType}`;
    const current = grouped.get(key);
    const cost = row.quantity * row.price;

    if (!current) {
      grouped.set(key, {
        ...row,
        ticker,
        assetType,
        totalCost: cost,
      });
      continue;
    }

    // Suma cantidades, pero NO recalcula el precio de compra: mantiene el primero que puso el usuario
    current.quantity += row.quantity;
    current.totalCost += cost;
    // current.price se mantiene fijo como el precio de la primera compra
  }

  // Devuelve la estructura agrupada, manteniendo el precio de compra original
  return Array.from(grouped.values()).map((row) => ({
    ...row,
    price: row.price, // precio de compra original
    totalCost: row.totalCost,
  }));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Formato de datos inválido" }, { status: 400 });
    }

    const typedRows = rows as ImportRow[];
    const groupedRows = groupRows(typedRows);

    if (groupedRows.length === 0) {
      return NextResponse.json({ error: "No encontramos filas válidas para importar" }, { status: 400 });
    }

    let processed = 0;
    const errors: string[] = [];

    console.log(`[ImportAPI] Iniciando reemplazo de cartera con ${groupedRows.length} filas agrupadas para el usuario ${user.id}`);

    await db.$transaction(async (tx) => {
      await tx.position.deleteMany({ where: { userId: user.id } });
      await tx.transaction.deleteMany({
        where: {
          userId: user.id,
          source: "CSV",
        },
      });

      for (const row of groupedRows) {
        try {
          const cleanTicker = row.ticker.toUpperCase().trim();
          const dbType = normalizeAssetType(row.assetType);
          const currency = normalizeCurrency(row);
          const storedSymbol = resolveAssetStorageSymbol(cleanTicker, row.assetType);
          const quoteMarket = resolvePreferredQuoteMarket(cleanTicker, row.assetType);
          const yahooSymbol = quoteMarket === 'local' ? toBCBASymbol(cleanTicker) : cleanTicker;

          const asset = await tx.asset.upsert({
            where: { symbol: storedSymbol },
            update: {
              type: dbType,
              currency,
              yahooSymbol,
            },
            create: {
              symbol: storedSymbol,
              name: cleanTicker,
              type: dbType,
              market: "BCBA",
              currency,
              yahooSymbol,
            },
          });

          await tx.position.create({
            data: {
              userId: user.id,
              assetId: asset.id,
              quantity: row.quantity,
              avgPrice: row.price,
              currency,
            },
          });

          await tx.transaction.create({
            data: {
              userId: user.id,
              assetId: asset.id,
              type: "BUY",
              quantity: row.quantity,
              price: row.price,
              total: row.quantity * row.price,
              currency,
              date: new Date(),
              source: "CSV",
            },
          });

          processed++;
        } catch (e: any) {
          console.error(`[ImportAPI] Error procesando fila ${row.ticker}:`, e.message);
          errors.push(`${row.ticker}: ${e.message}`);
        }
      }
    });

    console.log(`[ImportAPI] Finalizado. Procesados: ${processed}/${groupedRows.length}`);

    // Revalidar caché para que los cambios se vean inmediatamente
    revalidatePath("/");
    revalidatePath("/cartera");
    revalidatePath("/movimientos");

    return NextResponse.json({ 
      success: true, 
      processed,
      errors,
      total: groupedRows.length 
    });

  } catch (error) {
    console.error("[ImportAPI] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
