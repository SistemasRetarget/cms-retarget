import type { CheerioAPI } from "cheerio";
import type { PaletteEntry } from "./types";

/**
 * Quick & dirty palette extraction — scans inline styles and <style> contents
 * for hex/rgb colors and CSS custom properties named like --primary/--accent/etc.
 *
 * We do NOT load external stylesheets; that would balloon the analyzer's
 * latency and complexity. Most sites put their design-token CSS vars inline
 * on :root or the body, so this catches the important ones.
 */

const HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const RGB_RE = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/g;
const VAR_RE = /--(?:primary|accent|brand|background|bg|fg|text|foreground|color)[-\w]*\s*:\s*([^;}\n]+)/gi;

export function extractPalette($: CheerioAPI, themeColor?: string): PaletteEntry[] {
  const counts = new Map<string, { score: number; source: string }>();

  const bump = (hex: string, source: string, weight = 1) => {
    const norm = normalizeHex(hex);
    if (!norm) return;
    const prev = counts.get(norm);
    if (prev) prev.score += weight;
    else counts.set(norm, { score: weight, source });
  };

  // <meta name="theme-color">
  if (themeColor) bump(themeColor, "meta-theme", 5);

  // Inline styles on body/root/header/footer
  $("[style]").slice(0, 200).each((_, el) => {
    const style = $(el).attr("style") || "";
    for (const m of style.matchAll(HEX_RE)) bump(m[0], "inline");
    for (const m of style.matchAll(RGB_RE)) bump(rgbToHex(+m[1], +m[2], +m[3]), "inline");
  });

  // <style> blocks — look for CSS variables with semantically-named keys first
  const styleText = $("style").map((_, el) => $(el).html() || "").get().join("\n");
  for (const m of styleText.matchAll(VAR_RE)) {
    const val = m[1].trim();
    const hex = val.match(HEX_RE)?.[0];
    if (hex) bump(hex, "css-var", 3);
    const rgbMatch = val.match(RGB_RE);
    if (rgbMatch && rgbMatch[0]) {
      const nums = rgbMatch[0].match(/\d+/g);
      if (nums && nums.length >= 3 && nums[0] && nums[1] && nums[2]) {
        bump(rgbToHex(+nums[0], +nums[1], +nums[2]), "css-var", 3);
      }
    }
  }
  for (const m of styleText.matchAll(HEX_RE)) bump(m[0], "style-block", 0.25);

  const total = Array.from(counts.values()).reduce((s, v) => s + v.score, 0) || 1;

  return Array.from(counts.entries())
    .map(([hex, v]) => ({ hex, score: v.score / total, source: v.source }))
    .filter((e) => !isNearBlackOrWhite(e.hex) || e.score > 0.08)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function normalizeHex(input: string): string | null {
  const m = input.trim().match(/^#?([0-9a-fA-F]{3,6})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  return `#${h.toLowerCase()}`;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function isNearBlackOrWhite(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (r + g + b) / 3;
  return lum < 16 || lum > 240;
}
