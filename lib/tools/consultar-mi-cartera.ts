import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/prisma";

type PortfolioPosition = {
  asset: { symbol: string; name: string; currency: string | null }
  quantity: number
  avgPrice: number
}

export const createConsultarMiCartera = (userId: string) =>
  tool({
    description:
      "Consulta las posiciones actuales del usuario en su cartera: qué activos tiene, cuántas unidades y a qué precio promedio de compra. Úsala cuando el usuario pregunte por su cartera, sus tenencias o quiera saber qué tiene.",
    inputSchema: z.object({
      consulta: z.string().describe("Qué se quiere consultar (ej: 'todo')")
    }),
    execute: async ({ consulta }) => {
      console.log(`[Tool] consultarMiCartera → userId: ${userId}`);

      try {
        const positions = await db.position.findMany({
          where: { userId },
          include: { asset: true },
        });

        if (positions.length === 0) {
          return {
            tieneCartera: false,
            mensaje: "El usuario no tiene posiciones registradas aún.",
          };
        }

        return {
          tieneCartera: true,
          posiciones: (positions as PortfolioPosition[]).map((p) => ({
            ticker: p.asset.symbol,
            nombre: p.asset.name,
            cantidad: p.quantity,
            precioPromedio: p.avgPrice,
            moneda: p.asset.currency ?? "ARS",
          })),
        };
      } catch (error) {
        console.error("[Tool] consultarMiCartera error:", error);
        return { error: "No se pudo leer la cartera. Intentá de nuevo." };
      }
    },
  });