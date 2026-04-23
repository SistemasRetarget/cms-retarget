/**
 * Generador de Landing Pages con IA.
 * Reutiliza los providers existentes (Anthropic / Gemini / OpenAI).
 */

import { generateArticle, resolveConfig, type AIConfig } from "./providers";
import { getBreaker } from "@/lib/circuitBreaker";

export interface LandingBrief {
  topic: string;          // ej: "Software de inventario para PyMEs"
  audience: string;       // ej: "Dueños de tiendas y almacenes"
  goal: string;           // ej: "Conseguir demos gratuitas"
  tone?: string;          // ej: "profesional", "cercano", "técnico"
  sections?: string[];    // ej: ["hero","features","cta","faq"]
  language?: string;      // "es" | "en", default "es"
}

export interface HeroSection {
  blockType: "hero";
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  backgroundType: "solid" | "gradient" | "dark";
  backgroundColor: string;
}

export interface FeaturesItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesSection {
  blockType: "features";
  title: string;
  subtitle: string;
  items: FeaturesItem[];
}

export interface CTASection {
  blockType: "cta";
  headline: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  variant: "dark" | "light" | "accent";
}

export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  text: string;
  rating: number;
}

export interface TestimonialsSection {
  blockType: "testimonials";
  title: string;
  items: TestimonialItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  blockType: "faq";
  title: string;
  items: FAQItem[];
}

export interface StatsItem {
  value: string;
  label: string;
}

export interface StatsSection {
  blockType: "stats";
  title: string;
  items: StatsItem[];
}

export type LandingSection =
  | HeroSection
  | FeaturesSection
  | CTASection
  | TestimonialsSection
  | FAQSection
  | StatsSection;

export interface GeneratedLanding {
  title: string;
  slug: string;
  sections: LandingSection[];
  meta_title: string;
  meta_description: string;
}

const DEFAULT_SECTIONS = ["hero", "features", "stats", "cta", "faq"];

function buildLandingPrompt(brief: LandingBrief): string {
  const sections = brief.sections?.length ? brief.sections : DEFAULT_SECTIONS;
  const lang = brief.language || "es";
  const tone = brief.tone || "profesional";

  return `Genera una landing page completa para: "${brief.topic}".
Audiencia objetivo: ${brief.audience}.
Objetivo de conversión: ${brief.goal}.
Tono: ${tone}.
Idioma: ${lang}.

Genera exactamente estas secciones en orden: ${sections.join(", ")}.

Responde SOLO con JSON válido con esta estructura:
{
  "title": "Título interno del proyecto (máx 80 chars)",
  "slug": "url-slug-sin-espacios-ni-acentos",
  "meta_title": "Meta título SEO (máx 70 chars)",
  "meta_description": "Meta descripción SEO (máx 160 chars)",
  "sections": [
    ${sections.includes("hero") ? `{
      "blockType": "hero",
      "headline": "Título principal impactante (máx 80 chars)",
      "subheadline": "Subtítulo claro y convincente (máx 160 chars)",
      "ctaText": "Texto botón acción (máx 30 chars)",
      "ctaUrl": "#contacto",
      "backgroundType": "gradient",
      "backgroundColor": "#f8f7f4"
    }` : ""}
    ${sections.includes("features") ? `,{
      "blockType": "features",
      "title": "Título de la sección (máx 60 chars)",
      "subtitle": "Descripción breve (máx 120 chars)",
      "items": [
        {"icon": "emoji", "title": "Característica 1", "description": "Descripción breve"},
        {"icon": "emoji", "title": "Característica 2", "description": "Descripción breve"},
        {"icon": "emoji", "title": "Característica 3", "description": "Descripción breve"},
        {"icon": "emoji", "title": "Característica 4", "description": "Descripción breve"}
      ]
    }` : ""}
    ${sections.includes("stats") ? `,{
      "blockType": "stats",
      "title": "Resultados en números",
      "items": [
        {"value": "+500", "label": "Clientes activos"},
        {"value": "98%", "label": "Satisfacción"},
        {"value": "3x", "label": "Más productividad"},
        {"value": "24/7", "label": "Soporte disponible"}
      ]
    }` : ""}
    ${sections.includes("testimonials") ? `,{
      "blockType": "testimonials",
      "title": "Lo que dicen nuestros clientes",
      "items": [
        {"name": "Nombre Cliente", "role": "Cargo", "company": "Empresa", "text": "Testimonio convincente y específico.", "rating": 5},
        {"name": "Nombre Cliente", "role": "Cargo", "company": "Empresa", "text": "Otro testimonio relevante.", "rating": 5}
      ]
    }` : ""}
    ${sections.includes("cta") ? `,{
      "blockType": "cta",
      "headline": "Título de cierre impactante",
      "description": "Descripción motivadora de 1-2 frases.",
      "buttonText": "Acción principal",
      "buttonUrl": "#contacto",
      "variant": "dark"
    }` : ""}
    ${sections.includes("faq") ? `,{
      "blockType": "faq",
      "title": "Preguntas frecuentes",
      "items": [
        {"question": "Pregunta relevante 1?", "answer": "Respuesta clara y directa."},
        {"question": "Pregunta relevante 2?", "answer": "Respuesta clara y directa."},
        {"question": "Pregunta relevante 3?", "answer": "Respuesta clara y directa."},
        {"question": "Pregunta relevante 4?", "answer": "Respuesta clara y directa."}
      ]
    }` : ""}
  ]
}

Adapta TODO el contenido al tema, audiencia y objetivo indicados. No uses datos genéricos.`;
}

function extractLandingJSON(text: string): GeneratedLanding {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  const raw = match ? (match[1] || match[0]) : text;
  const obj = JSON.parse(raw);

  // Limpiar sections: filtrar nulls/undefined que puedan venir del template
  const sections: LandingSection[] = (Array.isArray(obj.sections) ? obj.sections : [])
    .filter(Boolean)
    .filter((s: Record<string, unknown>) => s && s.blockType);

  return {
    title: String(obj.title || "").slice(0, 80),
    slug: String(obj.slug || "landing-" + Date.now().toString(36)).slice(0, 80),
    sections,
    meta_title: String(obj.meta_title || obj.title || "").slice(0, 70),
    meta_description: String(obj.meta_description || "").slice(0, 160)
  };
}

export async function generateLandingPage(
  cfg: AIConfig,
  brief: LandingBrief
): Promise<GeneratedLanding> {
  if (!cfg.apiKey) throw new Error(`Falta API key para ${cfg.provider}. Configúrala en Admin → AI Settings.`);

  const prompt = buildLandingPrompt(brief);
  const breaker = getBreaker(`llm:${cfg.provider}`);
  const result = await breaker.execute(() => callProviderDirect(cfg, prompt));
  return extractLandingJSON(result);
}

async function callProviderDirect(cfg: AIConfig, userMessage: string): Promise<string> {
  const systemPrompt = "Eres un experto en marketing digital y copywriting. Genera landing pages efectivas con contenido persuasivo y específico. Responde SOLO con JSON válido, sin texto adicional.";

  switch (cfg.provider) {
    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": cfg.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }]
        })
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return data.content?.[0]?.text || "";
    }
    case "gemini": {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: "application/json" }
        })
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    case "openai": {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: 4096,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        })
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }
    default:
      throw new Error(`Proveedor desconocido: ${cfg.provider}`);
  }
}

export { resolveConfig };
