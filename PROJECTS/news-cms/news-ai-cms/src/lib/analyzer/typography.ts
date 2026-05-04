import type { CheerioAPI } from "cheerio";
import type { TypographyEntry } from "./types";

/**
 * Detect fonts the site actually uses:
 *   1. Google Fonts / Bunny Fonts / Adobe Fonts via <link> tags
 *   2. Custom @font-face rules in inline <style>
 *   3. Generic `font-family:` declarations for a fallback hint
 */

export function extractTypography($: CheerioAPI): TypographyEntry[] {
  const entries: TypographyEntry[] = [];
  const seen = new Set<string>();

  const push = (e: TypographyEntry) => {
    const key = e.family.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push(e);
  };

  // Google / Bunny / Adobe links
  $("link[rel='stylesheet'], link[rel='preload']").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (/fonts\.googleapis\.com/.test(href)) {
      for (const family of parseGoogleFonts(href)) {
        push({ family, source: "google", href });
      }
    } else if (/fonts\.bunny\.net/.test(href)) {
      for (const family of parseGoogleFonts(href)) {
        push({ family, source: "bunny", href });
      }
    } else if (/use\.typekit\.net|use\.adobe\.com/.test(href)) {
      push({ family: "Adobe Fonts (Typekit)", source: "adobe", href });
    }
  });

  // @font-face declarations
  const styleText = $("style").map((_, el) => $(el).html() || "").get().join("\n");
  for (const m of styleText.matchAll(/@font-face\s*\{[^}]*font-family:\s*["']?([^"';]+)/gi)) {
    push({ family: m[1].trim(), source: "custom" });
  }

  // font-family declarations (first family in each rule)
  const families = new Set<string>();
  for (const m of styleText.matchAll(/font-family:\s*([^;}\n]+)/gi)) {
    const first = m[1].split(",")[0].trim().replace(/["']/g, "");
    if (first && !isGenericKeyword(first)) families.add(first);
  }
  for (const f of families) push({ family: f, source: "system" });

  return entries.slice(0, 6);
}

function parseGoogleFonts(href: string): string[] {
  try {
    const url = new URL(href, "https://fonts.googleapis.com/");
    const family = url.searchParams.get("family") || "";
    return family
      .split("|")
      .flatMap((f) => f.split("&family="))
      .map((f) => f.split(":")[0].replace(/\+/g, " ").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isGenericKeyword(name: string): boolean {
  return /^(inherit|initial|revert|unset|sans-serif|serif|monospace|cursive|fantasy|system-ui|ui-[\w-]+)$/i.test(name);
}
