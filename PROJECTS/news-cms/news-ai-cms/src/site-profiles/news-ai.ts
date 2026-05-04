import type { SiteProfile } from "./types";

/**
 * News AI profile — the original news aggregator.
 * Full feature set: news pipeline, AI generation, trends, landings, analyzer, SEO.
 */
export const newsAiProfile: SiteProfile = {
  id: "news-ai",
  label: "News AI",
  features: {
    news: true,
    landingPages: true,
    trends: true,
    ai: true,
    analyzer: true,
    seoAdvanced: true,
    inlineEditor: true,
    googleTags: true,
  },
  branding: {
    siteName: "News AI",
    titleSuffix: "· News AI CMS",
    description: "Panel de administración — News AI CMS",
    primaryColor: "#8b7355",
  },
  seo: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    defaultTitle: "News AI · Blog de noticias con IA",
    defaultDescription: "Blog de noticias curadas y reescritas por IA desde múltiples fuentes.",
    organization: {
      name: "News AI",
    },
  },
  localization: {
    locales: [
      { label: "Español", code: "es" },
      { label: "English", code: "en" },
    ],
    defaultLocale: "es",
    fallback: true,
  },
};
