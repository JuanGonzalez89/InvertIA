import { tool } from "ai";
import { z } from "zod";

export const calcularMetricas = tool({
  description:
    "Calcula métricas financieras de una posición: ganancia/pérdida en pesos y porcentaje, valuación actual total. Usala después de tener el precio de mercado y los datos de la cartera del usuario.",
  inputSchema: z.object({
    precioCompra: z.string().describe("Precio promedio de compra en ARS como texto (ej: '100.5')"),
    precioActual: z.string().describe("Precio actual de mercado en ARS como texto"),
    cantidad: z.string().describe("Cantidad de unidades en posesión como texto"),
  }),
  execute: async ({ precioCompra: pcStr, precioActual: paStr, cantidad: cStr }) => {
    const precioCompra = parseFloat(pcStr) || 0;
    const precioActual = parseFloat(paStr) || 0;
    const cantidad = parseFloat(cStr) || 0;

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