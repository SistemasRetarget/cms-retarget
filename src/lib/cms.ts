/**
 * Lectura de contenido desde Payload para el frontend.
 * Usa la API local (no vía HTTP) para máximo rendimiento en SSR.
 */
import { getPayload } from "payload";
import config from "@payload-config";

export async function listArticles(opts: { limit?: number; category?: string; locale?: "es" | "en" } = {}) {
  const payload = await getPayload({ config });
  const where: Record<string, unknown> = { status: { equals: "published" } };
  if (opts.category) where["category.slug"] = { equals: opts.category };
  const res = await payload.find({
    collection: "articles",
    where: where as never,
    limit: opts.limit || 20,
    sort: "-publishedAt",
    locale: opts.locale || "es",
    depth: 2
  });
  return res.docs;
}

export async function getArticle(slug: string, locale: "es" | "en" = "es") {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "articles",
    where: { slug: { equals: slug }, status: { equals: "published" } },
    limit: 1,
    locale,
    depth: 2
  });
  return res.docs[0] || null;
}

export async function listCategories(locale: "es" | "en" = "es") {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "categories", limit: 100, sort: "order", locale
  });
  return res.docs;
}

export async function getCategory(slug: string, locale: "es" | "en" = "es") {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "categories", where: { slug: { equals: slug } }, limit: 1, locale
  });
  return res.docs[0] || null;
}

// Render básico de Lexical a HTML (párrafos simples)
export function renderLexical(val: unknown): string {
  const node = val as { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } };
  const children = node?.root?.children || [];
  return children.map((p) => {
    const text = (p.children || []).map((c) => c.text || "").join("");
    return text ? `<p>${escapeHtml(text)}</p>` : "";
  }).join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}
