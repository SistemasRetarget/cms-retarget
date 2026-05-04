import type { CheerioAPI } from "cheerio";
import type { MetaSummary } from "./types";

/**
 * Extract meta / OG / Twitter / favicon / lang from a loaded cheerio document.
 */
export function extractMeta($: CheerioAPI, baseUrl: string): MetaSummary {
  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};

  $('meta[property^="og:"]').each((_, el) => {
    const p = $(el).attr("property");
    const c = $(el).attr("content");
    if (p && c) og[p.replace(/^og:/, "")] = c;
  });

  $('meta[name^="twitter:"]').each((_, el) => {
    const n = $(el).attr("name");
    const c = $(el).attr("content");
    if (n && c) twitter[n.replace(/^twitter:/, "")] = c;
  });

  const canonical = $('link[rel="canonical"]').attr("href");
  const faviconHref =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href");

  return {
    title: $("title").first().text().trim() || og.title || twitter.title || undefined,
    description:
      $('meta[name="description"]').attr("content") ||
      og.description ||
      twitter.description ||
      undefined,
    canonical: canonical ? absoluteUrl(canonical, baseUrl) : undefined,
    language: $("html").attr("lang") || undefined,
    favicon: faviconHref ? absoluteUrl(faviconHref, baseUrl) : undefined,
    themeColor: $('meta[name="theme-color"]').attr("content") || undefined,
    viewport: $('meta[name="viewport"]').attr("content") || undefined,
    og,
    twitter,
  };
}

function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
