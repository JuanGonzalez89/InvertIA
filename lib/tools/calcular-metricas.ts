import { tool } from "ai";
import { z } from "zod";

export const calcularMetricas = tool({
  description:
    "Calcula métricas financieras de una posición: ganancia/pérdida en pesos y porcentaje, valuación actual total. Usala después de tener el precio de mercado y los datos de la cartera del usuario.",
  inputSchema: z.union([
    z.object({
      precioCompra: z.string().optional().describe("Precio promedio de compra en ARS como texto (ej: '100.5')"),
      precioActual: z.string().optional().describe("Precio actual de mercado en ARS como texto"),
      cantidad: z.string().optional().describe("Cantidad de unidades en posesión como texto"),
    }),
    z.null(),
  ]),
  execute: async (input: { precioCompra?: string; precioActual?: string; cantidad?: string } | null) => {
    const precioCompra = parseFloat(input?.precioCompra ?? "") || 0;
    const precioActual = parseFloat(input?.precioActual ?? "") || 0;
    const cantidad = parseFloat(input?.cantidad ?? "") || 0;

    console.log(`[Tool] calcularMetricas → ${cantidad} unidades @ $${precioCompra} → $${precioActual}`);

    const costoBruto = precioCompra * cantidad;
    const valuacionActual = precioActual * cantidad;
    const gananciaPesos = valuacionActual - costoBruto;
    const gananciaPorcentaje = ((precioActual - precioCompra) / precioCompra) * 100;
    const enGanancia = gananciaPesos >= 0;

    return {
      costoBruto: Math.round(costoBruto),
      valuacionActual: Math.round(valuacionActual),
      gananciaPesos: Math.round(gananciaPesos),
      gananciaPorcentaje: parseFloat(gananciaPorcentaje.toFixed(2)),
      enGanancia,
      resumen: enGanancia
        ? `Ganancia de $${Math.round(gananciaPesos).toLocaleString("es-AR")} ARS (+${gananciaPorcentaje.toFixed(2)}%)`
        : `Pérdida de $${Math.abs(Math.round(gananciaPesos)).toLocaleString("es-AR")} ARS (${gananciaPorcentaje.toFixed(2)}%)`,
    };
  },
});