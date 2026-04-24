import type { SiteProfile } from "./types";

/**
 * Agency profile — landings + site analyzer + SEO, no news/trends.
 * For agency sites that sell services, clone competitor sites, and deliver
 * landing pages powered by AI.
 */
export const agencyProfile: SiteProfile = {
  id: "agency",
  label: "Agencia",
  features: {
    news: false,
    landingPages: true,
    trends: false,
    ai: true,
    analyzer: true,
    seoAdvanced: true,
    inlineEditor: true,
    googleTags: true,
  },
  branding: {
    siteName: "Retarget",
    titleSuffix: "· Retarget CMS",
    description: "Panel de administración — Retarget Agencia",
    primaryColor: "#1a1a1a",
  },
  seo: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    defaultTitle: "Retarget · Agencia digital",
    defaultDescription: "Landing pages, SEO y estrategia digital impulsada por IA.",
    organization: {
      name: "Retarget",
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
