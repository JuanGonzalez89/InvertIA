import { tool } from "ai";
import { z } from "zod";

export const calcularMetricas = tool({
  description:
    "Calcula métricas financieras de una posición: ganancia/pérdida en pesos y porcentaje, valuación actual total. Usala después de tener el precio de mercado y los datos de la cartera del usuario.",
  inputSchema: z.object({
    precioCompra: z.number().describe("Precio promedio de compra en ARS"),
    precioActual: z.number().describe("Precio actual de mercado en ARS"),
    cantidad: z.number().describe("Cantidad de unidades en posesión"),
  }),
  execute: async ({ precioCompra, precioActual, cantidad }) => {
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