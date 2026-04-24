import type { SiteProfile } from "./types";

/**
 * Simple blog profile — no AI, no news aggregation, no trends.
 * Just Articles + Categories + Media, edited manually. Keeps the inline editor
 * and advanced SEO so the agency can deliver a hand-written blog with polish.
 */
export const blogSimpleProfile: SiteProfile = {
  id: "blog-simple",
  label: "Blog simple",
  features: {
    news: true, // Articles/Categories stay; Sources/collectors are not used (no AI)
    landingPages: false,
    trends: false,
    ai: false,
    analyzer: false,
    seoAdvanced: true,
    inlineEditor: true,
    googleTags: true,
  },
  branding: {
    siteName: "Blog",
    titleSuffix: "· Blog",
    description: "Panel de administración — Blog",
  },
  seo: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    defaultTitle: "Blog",
    defaultDescription: "Artículos y novedades.",
  },
  localization: {
    locales: [
      { label: "Español", code: "es" },
    ],
    defaultLocale: "es",
    fallback: true,
  },
};
