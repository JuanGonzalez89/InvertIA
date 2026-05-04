import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/prisma";
import { executeOrder } from "@/lib/services/portfolio.service";

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

    // Agrupar filas por ticker para optimizar si hay muchas transacciones del mismo activo
    // Por simplicidad en esta fase, procesamos una por una usando el servicio existente
    // que ya maneja promedios y balances.
    
    let processed = 0;
    const errors: string[] = [];

    console.log(`[ImportAPI] Iniciando procesamiento de ${rows.length} filas para el usuario ${user.id}`);

    for (const row of rows) {
      try {
        console.log(`[ImportAPI] Procesando ticker: ${row.ticker}, cantidad: ${row.quantity}`);
        await executeOrder(
          user.id,
          row.ticker,
          row.quantity,
          row.price,
          row.type,
          row.assetType || 'OTRO'
        );
        processed++;
      } catch (e: any) {
        console.error(`[ImportAPI] Error procesando fila ${row.ticker}:`, e.message);
        errors.push(`${row.ticker}: ${e.message}`);
      }
    }

    console.log(`[ImportAPI] Finalizado. Procesados: ${processed}/${rows.length}`);

    // Revalidar caché para que los cambios se vean inmediatamente
    revalidatePath("/");
    revalidatePath("/cartera");

    return NextResponse.json({ 
      success: true, 
      processed,
      errors,
      total: rows.length 
    });

  } catch (error) {
    console.error("[ImportAPI] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
