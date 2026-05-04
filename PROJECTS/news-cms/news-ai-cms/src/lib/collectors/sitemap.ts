/**
 * Collector de Sitemap.xml
 * Soporta sitemap index (sitemap de sitemaps) y sitemap de URLs.
 * Extrae las URLs más recientes y las pasa al scraper HTML.
 */

import { scrapeHTML } from "./html";
import type { CollectedItem } from "./types";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const UA = "Mozilla/5.0 (compatible; NewsAICMS/1.0)";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  priority?: number;
}

function pickAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1").trim());
  }
  return results;
}

function pick(xml: string, tag: string): string {
  const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(r);
  return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1").trim() : "";
}

async function fetchXML(url: string): Promise<string> {
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": UA, Accept: "application/xml,text/xml,*/*" },
    timeoutMs: 15_000
  });
  if (!res.ok) throw new Error(`Sitemap HTTP ${res.status} @ ${url}`);
  return res.text();
}

async function parseSitemapUrls(xml: string): Promise<SitemapEntry[]> {
  const urls: SitemapEntry[] = [];
  const urlBlocks = xml.match(/<url>([\s\S]*?)<\/url>/gi) || [];
  for (const block of urlBlocks) {
    const loc = pick(block, "loc");
    if (!loc) continue;
    const lastmod = pick(block, "lastmod");
    const priority = parseFloat(pick(block, "priority")) || 0.5;
    urls.push({ loc, lastmod, priority });
  }
  return urls;
}

async function resolveAllUrls(url: string): Promise<SitemapEntry[]> {
  const xml = await fetchXML(url);

  // Sitemap index: contiene <sitemap> con <loc>
  const isIndex = /<sitemapindex/i.test(xml);
  if (isIndex) {
    const childLocs = pickAll(xml, "loc").filter(l => l.endsWith(".xml"));
    // Tomar hasta 3 sub-sitemaps para no sobrecargar
    const entries: SitemapEntry[] = [];
    for (const loc of childLocs.slice(0, 3)) {
      try {
        const childXml = await fetchXML(loc);
        const childEntries = await parseSitemapUrls(childXml);
        entries.push(...childEntries);
      } catch { /* skip */ }
    }
    return entries;
  }

  return parseSitemapUrls(xml);
}

export async function collectFromSitemap(
  url: string,
  max = 5
): Promise<CollectedItem[]> {
  const entries = await resolveAllUrls(url);

  // Ordenar por lastmod descendente, luego por priority
  const sorted = entries
    .filter(e => !e.loc.endsWith(".xml"))
    .sort((a, b) => {
      if (a.lastmod && b.lastmod) return b.lastmod.localeCompare(a.lastmod);
      return (b.priority || 0) - (a.priority || 0);
    })
    .slice(0, max * 3); // fetcheamos más por si algunas fallan

  const items: CollectedItem[] = [];
  for (const entry of sorted) {
    if (items.length >= max) break;
    try {
      const item = await scrapeHTML(entry.loc);
      if (item) {
        if (entry.lastmod) item.publishedAt = entry.lastmod;
        items.push(item);
      }
    } catch { /* skip URL que falla */ }
  }

  return items;
}
