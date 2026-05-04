import * as cheerio from "cheerio";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { extractMeta } from "./meta";
import { detectIntegrations } from "./integrations";
import { extractPalette } from "./palette";
import { extractTypography } from "./typography";
import { extractTech } from "./tech";
import { extractStructure } from "./structure";
import { extractSchemaOrg } from "./schema";
import type { SiteBlueprint } from "./types";

export type { SiteBlueprint } from "./types";

const UA = "Mozilla/5.0 (compatible; NewsAICMS-Analyzer/1.0; +https://retarget.cl/bot)";
const MAX_HTML_BYTES = 2_500_000;

/**
 * Analyze a public URL and produce a full SiteBlueprint.
 * Safe to call from API route handlers — fully server-side, bounded size,
 * bounded timeout (20s), captures partial data on errors in sub-extractors.
 */
export async function analyzeSite(url: string): Promise<SiteBlueprint> {
  const { rawHtml, finalUrl, headers, size } = await fetchHtml(url);
  const $ = cheerio.load(rawHtml);

  const meta = extractMeta($, finalUrl);
  const structure = extractStructure($, finalUrl);
  const integrations = detectIntegrations($, rawHtml);
  const palette = extractPalette($, meta.themeColor);
  const typography = extractTypography($);
  const tech = extractTech($, rawHtml, headers);
  const schemaOrg = extractSchemaOrg($);

  return {
    url,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    meta,
    structure,
    integrations,
    palette,
    typography,
    tech,
    schemaOrg,
    htmlSize: size,
    summary: buildSummary({ meta, structure, integrations, tech }),
  };
}

async function fetchHtml(url: string): Promise<{
  rawHtml: string;
  finalUrl: string;
  headers: Record<string, string>;
  size: number;
}> {
  const res = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 20_000,
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Analyzer HTTP ${res.status} for ${url}`);
  const text = await res.text();
  const sliced = text.slice(0, MAX_HTML_BYTES);
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  return {
    rawHtml: sliced,
    finalUrl: res.url || url,
    headers,
    size: text.length,
  };
}

function buildSummary(b: Pick<SiteBlueprint, "meta" | "structure" | "integrations" | "tech">): string {
  const lines: string[] = [];
  if (b.meta.title) lines.push(`Titulo: ${b.meta.title}`);
  if (b.meta.description) lines.push(`Desc: ${b.meta.description}`);
  if (b.tech.framework || b.tech.cms) {
    lines.push(`Stack: ${[b.tech.framework, b.tech.cms].filter(Boolean).join(" / ")}`);
  }
  if (b.structure.headings.length) {
    const h1s = b.structure.headings.filter((h) => h.level === 1).slice(0, 2);
    const h2s = b.structure.headings.filter((h) => h.level === 2).slice(0, 5);
    if (h1s.length) lines.push(`H1: ${h1s.map((h) => h.text).join(" | ")}`);
    if (h2s.length) lines.push(`H2: ${h2s.map((h) => h.text).join(" | ")}`);
  }
  if (b.integrations.length) {
    lines.push(`Integraciones: ${b.integrations.map((i) => i.label).join(", ")}`);
  }
  lines.push(
    `Estructura: ${b.structure.totalSections} secciones, ${b.structure.totalImages} imgs, ${b.structure.totalForms} forms, hero=${b.structure.hasHero ? "sí" : "no"}, cta=${b.structure.hasCTA ? "sí" : "no"}`
  );
  return lines.join("\n");
}
