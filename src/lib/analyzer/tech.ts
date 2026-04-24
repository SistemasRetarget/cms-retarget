import type { CheerioAPI } from "cheerio";
import type { TechHint } from "./types";

/**
 * Detect the framework/CMS powering a site. Heuristics based on common
 * fingerprints (<meta name=generator>, well-known script paths, data attrs).
 */

export function extractTech($: CheerioAPI, rawHtml: string, headers: Record<string, string>): TechHint {
  const hint: TechHint = {};

  hint.generator = $('meta[name="generator"]').attr("content") || undefined;
  hint.hostedBy = headers["server"] || headers["x-powered-by"] || undefined;

  // Next.js
  if (/\/_next\//.test(rawHtml) || $('script[src*="/_next/"]').length > 0) {
    hint.framework = "Next.js";
  }

  // WordPress
  if (/wp-content\//.test(rawHtml) || /wp-includes\//.test(rawHtml) || hint.generator?.toLowerCase().includes("wordpress")) {
    hint.cms = "WordPress";
  }

  // Shopify
  if (/cdn\.shopify\.com/.test(rawHtml) || /Shopify\.shop/.test(rawHtml)) {
    hint.cms = "Shopify";
  }

  // Wix
  if (/static\.wixstatic\.com/.test(rawHtml) || hint.generator?.toLowerCase().includes("wix")) {
    hint.cms = "Wix";
  }

  // Squarespace
  if (/static1\.squarespace\.com/.test(rawHtml) || hint.generator?.toLowerCase().includes("squarespace")) {
    hint.cms = "Squarespace";
  }

  // Webflow
  if (/assets\.website-files\.com/.test(rawHtml) || /Webflow/.test(rawHtml)) {
    hint.cms = "Webflow";
  }

  // Drupal
  if (hint.generator?.toLowerCase().includes("drupal") || /\/sites\/default\/files\//.test(rawHtml)) {
    hint.cms = "Drupal";
  }

  // Ghost
  if (/ghost-theme|\/ghost\/api\//.test(rawHtml) || hint.generator?.toLowerCase().includes("ghost")) {
    hint.cms = "Ghost";
  }

  // Framer
  if (/framerusercontent\.com/.test(rawHtml)) {
    hint.framework = "Framer";
  }

  // Astro
  if ($('[data-astro-cid]').length > 0 || /\/astro\//.test(rawHtml)) {
    hint.framework = "Astro";
  }

  // SvelteKit
  if (/\/_app\/immutable\//.test(rawHtml)) {
    hint.framework = "SvelteKit";
  }

  // React (naive — only set if no other framework detected)
  if (!hint.framework && (/__react|data-reactroot|react-dom/.test(rawHtml))) {
    hint.framework = "React";
  }

  return hint;
}
