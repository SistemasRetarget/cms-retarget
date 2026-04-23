/**
 * Wrapper unificado para 3 proveedores AI: Anthropic / Gemini / OpenAI.
 * Las credenciales vienen del global `ai-settings` (se pasan en runtime).
 */

export type Provider = "anthropic" | "gemini" | "openai";

export interface AIConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  systemPrompt?: string;
}

export interface GeneratedArticle {
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
}

export interface SourceInput {
  title: string;
  content: string;
  url?: string;
  language?: string;
}

function extractJSON(text: string): GeneratedArticle {
  // Tolera respuestas con ```json ... ``` o con texto alrededor
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  const raw = match ? (match[1] || match[0]) : text;
  const obj = JSON.parse(raw);
  return {
    title: String(obj.title || "").slice(0, 200),
    excerpt: String(obj.excerpt || "").slice(0, 300),
    body: String(obj.body || ""),
    tags: Array.isArray(obj.tags) ? obj.tags.map(String).slice(0, 8) : [],
    meta_title: String(obj.meta_title || obj.title || "").slice(0, 80),
    meta_description: String(obj.meta_description || obj.excerpt || "").slice(0, 200)
  };
}

function buildUserMessage(source: SourceInput): string {
  return `Fuente original:
Título: ${source.title}
URL: ${source.url || "(sin URL)"}
Idioma original: ${source.language || "desconocido"}

Contenido:
"""
${source.content.slice(0, 8000)}
"""

Responde SOLO con JSON válido con las claves: title, excerpt, body, tags (array), meta_title, meta_description.`;
}

// ── Anthropic (Claude) ──────────────────────────────────────────
async function callAnthropic(cfg: AIConfig, source: SourceInput): Promise<GeneratedArticle> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 2048,
      system: cfg.systemPrompt,
      messages: [{ role: "user", content: buildUserMessage(source) }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return extractJSON(text);
}

// ── Google Gemini ───────────────────────────────────────────────
async function callGemini(cfg: AIConfig, source: SourceInput): Promise<GeneratedArticle> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: cfg.systemPrompt || "" }] },
      contents: [{ role: "user", parts: [{ text: buildUserMessage(source) }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return extractJSON(text);
}

// ── OpenAI ──────────────────────────────────────────────────────
async function callOpenAI(cfg: AIConfig, source: SourceInput): Promise<GeneratedArticle> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 2048,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: cfg.systemPrompt },
        { role: "user", content: buildUserMessage(source) }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return extractJSON(text);
}

export async function generateArticle(cfg: AIConfig, source: SourceInput): Promise<GeneratedArticle> {
  if (!cfg.apiKey) throw new Error(`Falta API key para ${cfg.provider}. Configúrala en Admin → AI Settings.`);
  switch (cfg.provider) {
    case "anthropic": return callAnthropic(cfg, source);
    case "gemini": return callGemini(cfg, source);
    case "openai": return callOpenAI(cfg, source);
    default: throw new Error(`Proveedor desconocido: ${cfg.provider}`);
  }
}

export function resolveConfig(settings: {
  activeProvider: Provider;
  anthropicApiKey?: string; anthropicModel?: string;
  geminiApiKey?: string; geminiModel?: string;
  openaiApiKey?: string; openaiModel?: string;
  systemPrompt?: string;
}): AIConfig {
  const p = settings.activeProvider;
  const keyMap = {
    anthropic: { apiKey: settings.anthropicApiKey, model: settings.anthropicModel || "claude-sonnet-4-5" },
    gemini: { apiKey: settings.geminiApiKey, model: settings.geminiModel || "gemini-2.0-flash" },
    openai: { apiKey: settings.openaiApiKey, model: settings.openaiModel || "gpt-4o-mini" }
  } as const;
  return {
    provider: p,
    apiKey: keyMap[p].apiKey || "",
    model: keyMap[p].model,
    systemPrompt: settings.systemPrompt
  };
}
