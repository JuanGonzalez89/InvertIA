import { tool } from "ai";
import { z } from "zod";

export const explicarDecision = tool({
  description:
    "Genera un análisis estructurado de una decisión financiera con pros, contras y nivel de riesgo. Usala SIEMPRE antes de dar una recomendación al usuario sobre comprar, vender o mantener un activo.",
  inputSchema: z.union([
    z.object({
      accion: z.enum(["comprar", "vender", "mantener"]).optional(),
      ticker: z.string().optional(),
      razonamiento: z
        .string()
        .optional()
        .describe("El razonamiento completo detrás de la recomendación"),
      pros: z.array(z.string()).optional().describe("Lista de razones a favor"),
      contras: z.array(z.string()).optional().describe("Lista de riesgos o razones en contra"),
      nivelRiesgo: z.enum(["bajo", "medio", "alto"]).optional(),
      advertencia: z
        .string()
        .optional()
        .describe("Advertencia regulatoria si aplica (dejar vacío si no hay)"),
    }),
    z.null(),
  ]),
  execute: async (params: {
    accion?: "comprar" | "vender" | "mantener";
    ticker?: string;
    razonamiento?: string;
    pros?: string[];
    contras?: string[];
    nivelRiesgo?: "bajo" | "medio" | "alto";
    advertencia?: string;
  } | null) => {
    const safeParams = {
      accion: params?.accion ?? "mantener",
      ticker: params?.ticker ?? "desconocido",
      razonamiento: params?.razonamiento ?? "El modelo no proporcionó razonamiento estructurado.",
      pros: params?.pros ?? [],
      contras: params?.contras ?? [],
      nivelRiesgo: params?.nivelRiesgo ?? "medio",
      advertencia: params?.advertencia,
    };

    console.log(`[Tool] explicarDecision → ${safeParams.accion} ${safeParams.ticker}`);

    return {
      ...safeParams,
      advertencia:
        safeParams.advertencia ??
        "Esto no constituye asesoramiento financiero profesional. Consultá con un asesor habilitado antes de operar.",
    };
  },
});