import type { CheerioAPI } from "cheerio";
import type { StructureHeading, StructureLink, StructureSummary } from "./types";

/**
 * Extract page structure: headings hierarchy, primary nav and footer links,
 * and quick flags for hero/CTA presence + image/form counts.
 *
 * Keeps result bounded so it can be safely passed to an LLM as a blueprint.
 */

const MAX_LINKS = 12;
const MAX_HEADINGS = 20;

export function extractStructure($: CheerioAPI, baseUrl: string): StructureSummary {
  const headings: StructureHeading[] = [];
  $("h1, h2, h3").each((_, el) => {
    if (headings.length >= MAX_HEADINGS) return false;
    const tag = el.tagName.toLowerCase();
    const level = (tag === "h1" ? 1 : tag === "h2" ? 2 : 3) as 1 | 2 | 3;
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) headings.push({ level, text: text.slice(0, 160) });
  });

  const navLinks: StructureLink[] = [];
  $("header a, nav a").each((_, el) => {
    if (navLinks.length >= MAX_LINKS) return false;
    const link = normalizeLink($, el, baseUrl);
    if (link) navLinks.push(link);
  });

  const footerLinks: StructureLink[] = [];
  $("footer a").each((_, el) => {
    if (footerLinks.length >= MAX_LINKS) return false;
    const link = normalizeLink($, el, baseUrl);
    if (link) footerLinks.push(link);
  });

  // Heuristic hero detection: large heading in first 1/3 of page + a CTA button nearby.
  const hasHero = $("h1").length > 0 || $("[class*='hero']").length > 0;
  const hasCTA =
    $("a[class*='cta'], button[class*='cta'], a[class*='btn-primary'], button[class*='btn-primary']").length > 0 ||
    $("a,button").filter((_, el) => /comenzar|empezar|contactar|comprar|get started|book|demo|sign up/i.test($(el).text())).length > 0;

  return {
    headings,
    navLinks: dedupeLinks(navLinks),
    footerLinks: dedupeLinks(footerLinks),
    hasHero,
    hasCTA,
    totalImages: $("img").length,
    totalForms: $("form").length,
    totalSections: $("section").length,
  };
}

function normalizeLink($: CheerioAPI, el: import("domhandler").Element, base: string): StructureLink | null {
  const href = $(el).attr("href");
  if (!href) return null;
  const label = $(el).text().replace(/\s+/g, " ").trim();
  if (!label || label.length > 60) return null;
  try {
    return { label, href: new URL(href, base).toString() };
  } catch {
    return { label, href };
  }
}

function dedupeLinks(list: StructureLink[]): StructureLink[] {
  const seen = new Set<string>();
  const out: StructureLink[] = [];
  for (const l of list) {
    const key = `${l.label.toLowerCase()}|${l.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}
