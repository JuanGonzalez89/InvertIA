import { generateText } from "ai";
import { getGroqModel } from "@/lib/ai/groq";

export type NewsImpact = "Bullish" | "Bearish" | "Neutral";

export type AnalyzedNews = {
  title: string;
  link: string | null;
  source: string | null;
  publishedAt: string | null;
  summary: string;
  impact: NewsImpact;
  impactReason: string;
};

let groqDisabled = false;

function buildFallbackNews(news: any[]): AnalyzedNews[] {
  return news.map((n) => ({
    title: n.title,
    link: n.link ?? null,
    source: n.source ?? null,
    publishedAt: n.publishedAt ?? null,
    summary: "No se pudo generar el resumen automático.",
    impact: "Neutral",
    impactReason: "Análisis técnico no disponible temporalmente.",
  }));
}

function isAuthError(error: unknown): boolean {
  const status = (error as any)?.status ?? (error as any)?.statusCode;
  const message = String((error as any)?.message ?? "").toLowerCase();
  const responseBody = String((error as any)?.responseBody ?? "").toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    message.includes("invalid api key") ||
    message.includes("invalid_api_key") ||
    responseBody.includes("invalid api key") ||
    responseBody.includes("invalid_api_key")
  );
}

/**
 * Analiza noticias financieras para determinar sentimiento e impacto.
 */
export async function analyzeNews(ticker: string, news: any[]): Promise<AnalyzedNews[]> {
  if (!news || news.length === 0) return [];

  // Filtrar duplicados y spam obvio (títulos muy cortos o sin palabras financieras)
  const financialKeywords = ['dividend', 'earnings', 'profit', 'market', 'stock', 'share', 'fed', 'rate', 'revenue', 'growth', 'buy', 'sell', 'analyst', 'price', 'target'];
  const filteredNews = news
    .filter(n => {
      const title = n.title.toLowerCase();
      return title.length > 10 && financialKeywords.some(kw => title.includes(kw));
    })
    .slice(0, 4);

  if (filteredNews.length === 0) return [];

  if (groqDisabled || !process.env.GROQ_API_KEY?.trim()) {
    return buildFallbackNews(filteredNews);
  }

  const newsContext = filteredNews.map((n, i) => `[${i}] ${n.title}`).join("\n");

  const prompt = `Actúa como un Analista de Riesgo Financiero Senior. Activo: "${ticker}".
Analiza las siguientes noticias y determina su impacto real en el precio del activo.
Busca detalles sobre ganancias (earnings), proyecciones (guidance), cambios en tasas, dividendos, fusiones o eventos macro relevantes.

Noticias:
${newsContext}

Genera un array JSON con este formato exacto para cada noticia (respetando el índice):
1. "summary": Un análisis profesional, técnico y detallado (máx 35 palabras). NO repitas el título. Explica por qué es relevante.
2. "impact": "Bullish" (alcista), "Bearish" (bajista) o "Neutral".
3. "impactReason": Justificación técnica muy precisa (ej: "EPS superó estimaciones en 12%" o "Aumento de costos operativos").

Responde ÚNICAMENTE con el objeto JSON puro, sin explicaciones ni markdown:
[{"summary": "...", "impact": "...", "impactReason": "..."}]`.trim();

  try {
    const { text } = await generateText({
      model: getGroqModel(),
      system: "Eres un experto en análisis fundamental de mercados. Tu objetivo es procesar noticias y devolver un JSON válido con insights técnicos profundos.",
      prompt,
    });

    // Limpiar el texto para asegurar que solo quede el JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    
    const analysis = JSON.parse(jsonString);

    return filteredNews.map((n, i) => ({
      title: n.title,
      link: n.link ?? null,
      source: n.source ?? null,
      publishedAt: n.publishedAt ?? null,
      summary: analysis[i]?.summary || analysis[0]?.summary || "Análisis técnico en proceso...",
      impact: (analysis[i]?.impact || "Neutral") as NewsImpact,
      impactReason: analysis[i]?.impactReason || "Sin justificación técnica disponible.",
    }));
  } catch (error) {
    const authError = isAuthError(error);

    if (authError) {
      groqDisabled = true;
      console.warn("[NewsAnalyzer] Groq auth failed. Desactivando análisis automático.", error);
    } else {
      console.error("[NewsAnalyzer] Error en análisis con Groq:", error);
    }

    return buildFallbackNews(filteredNews);
  }
}
