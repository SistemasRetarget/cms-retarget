/**
 * Analizador de tendencias: toma artículos publicados dentro de una ventana
 * temporal y detecta temas recurrentes usando el proveedor AI activo.
 */
import type { AIConfig } from "@/lib/ai/providers";
import { getBreaker } from "@/lib/circuitBreaker";

export interface TrendArticleInput {
  id: string | number;
  title: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
}

export interface Trend {
  title: string;
  summary: string;
  categories: string[];
  articleIds: Array<string | number>;
  score: number;
}

export interface TrendResult {
  window: "24h" | "48h";
  analyzedAt: string;
  articlesAnalyzed: number;
  trends: Trend[];
  provider: string;
  model: string;
}

function buildPrompt(articles: TrendArticleInput[], window: "24h" | "48h"): string {
  const list = articles.map((a) => {
    return `- [id:${a.id}] (${a.category || "s/categoría"}) ${a.title}${a.excerpt ? ` — ${a.excerpt.slice(0, 140)}` : ""}`;
  }).join("\n");

  return `Analiza las siguientes ${articles.length} noticias publicadas en las últimas ${window === "24h" ? "24" : "48"} horas e identifica las TENDENCIAS o TEMAS RECURRENTES (máximo 5).

Un tema tendencia es un asunto tratado por múltiples noticias o que acumula señales de importancia.

Noticias:
${list}

Devuelve SOLO JSON válido (sin markdown ni texto adicional) con esta estructura:
{
  "trends": [
    {
      "title": "Título corto del tema (max 60 chars)",
      "summary": "Descripción en 1-2 frases (max 220 chars)",
      "categories": ["slug-categoria-1", "slug-categoria-2"],
      "articleIds": [1, 5, 12],
      "score": 0.85
    }
  ]
}

Reglas:
- score: entre 0 y 1 (0.9+ = muy caliente, 0.6-0.8 = relevante, <0.6 = marginal)
- articleIds: IDs reales de la lista (mínimo 1, máximo 10 por tendencia)
- categories: slugs que aparecen en las noticias del cluster
- Ordenar trends por score descendente
- Si no hay tendencias claras (pocos artículos o sin patrones), devolver "trends": []`;
}

function extractJSON(text: string): { trends: Trend[] } {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  const raw = match ? (match[1] || match[0]) : text;
  const obj = JSON.parse(raw);
  const trends: Trend[] = Array.isArray(obj.trends) ? obj.trends : [];
  return {
    trends: trends
      .map((t) => ({
        title: String(t.title || "").slice(0, 80),
        summary: String(t.summary || "").slice(0, 280),
        categories: Array.isArray(t.categories) ? t.categories.map(String).slice(0, 5) : [],
        articleIds: Array.isArray(t.articleIds) ? t.articleIds.slice(0, 10) : [],
        score: Math.max(0, Math.min(1, Number(t.score) || 0))
      }))
      .filter((t) => t.title && t.articleIds.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  };
}

async function callAnthropic(cfg: AIConfig, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function callGemini(cfg: AIConfig, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1500, responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenAI(cfg: AIConfig, prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function analyzeTrends(
  cfg: AIConfig,
  articles: TrendArticleInput[],
  window: "24h" | "48h"
): Promise<TrendResult> {
  if (!cfg.apiKey) throw new Error(`Falta API key para ${cfg.provider}. Configúrala en AI Settings.`);

  if (articles.length === 0) {
    return {
      window,
      analyzedAt: new Date().toISOString(),
      articlesAnalyzed: 0,
      trends: [],
      provider: cfg.provider,
      model: cfg.model
    };
  }

  const prompt = buildPrompt(articles, window);
  const breaker = getBreaker(`llm:${cfg.provider}`);
  const text = await breaker.execute(async () => {
    switch (cfg.provider) {
      case "anthropic": return callAnthropic(cfg, prompt);
      case "gemini": return callGemini(cfg, prompt);
      case "openai": return callOpenAI(cfg, prompt);
      default: throw new Error(`Proveedor desconocido: ${cfg.provider}`);
    }
  });

  const { trends } = extractJSON(text);

  return {
    window,
    analyzedAt: new Date().toISOString(),
    articlesAnalyzed: articles.length,
    trends,
    provider: cfg.provider,
    model: cfg.model
  };
}
