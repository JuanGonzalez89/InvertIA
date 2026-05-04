import { tool } from "ai";
import { z } from "zod";

export const explicarDecision = tool({
  description:
    "Genera un análisis estructurado de una decisión financiera con pros, contras y nivel de riesgo. Usala SIEMPRE antes de dar una recomendación al usuario sobre comprar, vender o mantener un activo.",
  inputSchema: z.object({
    accion: z.enum(["comprar", "vender", "mantener"]),
    ticker: z.string(),
    razonamiento: z
      .string()
      .describe("El razonamiento completo detrás de la recomendación"),
    pros: z.array(z.string()).describe("Lista de razones a favor"),
    contras: z.array(z.string()).describe("Lista de riesgos o razones en contra"),
    nivelRiesgo: z.enum(["bajo", "medio", "alto"]),
     advertencia: z
       .string()
       .describe("Advertencia regulatoria si aplica (dejar vacío si no hay)"),
   }),
  execute: async (params) => {
    console.log(`[Tool] explicarDecision → ${params.accion} ${params.ticker}`);

    return {
      ...params,
      advertencia:
        params.advertencia ??
        "Esto no constituye asesoramiento financiero profesional. Consultá con un asesor habilitado antes de operar.",
    };
  },
});