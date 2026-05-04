/**
 * Scraper HTML con Cheerio.
 * Extrae el contenido principal de cualquier página web pública.
 */

import * as cheerio from "cheerio";
import type { CollectedItem } from "./types";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const UA = "Mozilla/5.0 (compatible; NewsAICMS/1.0; +https://github.com/news-ai-cms)";

// Selectores de contenido en orden de prioridad
const CONTENT_SELECTORS = [
  "article",
  "[role=main]",
  "main",
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".story-body",
  ".content-body",
  "#content",
  ".content"
];

// Elementos a eliminar antes de extraer texto
const REMOVE_SELECTORS = [
  "script", "style", "noscript", "iframe", "nav", "header",
  "footer", "aside", ".sidebar", ".comments", ".related",
  ".advertisement", ".ad", "[aria-hidden=true]"
];

export async function scrapeHTML(url: string): Promise<CollectedItem | null> {
  let html: string;
  try {
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" },
      timeoutMs: 15_000
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    throw new Error(`No se pudo descargar ${url}: ${(e as Error).message}`);
  }

  const $ = cheerio.load(html);

  // Título
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("h1").first().text() ||
    $("title").text() ||
    "";

  // Descripción/excerpt
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    "";

  // Thumbnail
  const thumbnail =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    "";

  // Autor
  const author =
    $('meta[name="author"]').attr("content") ||
    $('[rel=author]').first().text() ||
    $(".author").first().text() ||
    "";

  // Fecha de publicación
  const publishedAt =
    $('meta[property="article:published_time"]').attr("content") ||
    $('time[datetime]').first().attr("datetime") ||
    "";

  // Idioma
  const lang = $("html").attr("lang") || "";

  // Eliminar ruido
  REMOVE_SELECTORS.forEach((sel) => $(sel).remove());

  // Extraer contenido principal
  let contentEl = null;
  for (const sel of CONTENT_SELECTORS) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      contentEl = el;
      break;
    }
  }

  const rawContent = contentEl
    ? contentEl.text()
    : $("body").text();

  // Limpiar texto
  const content = (description + "\n\n" + rawContent)
    .replace(/\s{3,}/g, "\n\n")
    .replace(/\t/g, " ")
    .trim()
    .slice(0, 8000);

  if (!title || content.length < 100) return null;

  return {
    title: title.trim().slice(0, 200),
    content,
    url,
    platform: "web",
    mediaType: "article",
    language: lang.split("-")[0] || undefined,
    publishedAt: publishedAt || undefined,
    author: author.trim() || undefined,
    thumbnail: thumbnail || undefined
  };
}
