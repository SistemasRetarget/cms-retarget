/**
 * Site Profile system — turns this CMS into a multi-site platform.
 *
 * Each deployment picks a profile via the `SITE_PROFILE` env var. The profile
 * controls:
 *   - Which features/collections are enabled (feature flags)
 *   - Branding (titles, logo, icon, description)
 *   - SEO defaults (sitemap base URL, default OG image, schema.org org info)
 *   - Default locales / fallback
 *
 * The goal: one codebase, many agency deployments, each with a different
 * feature set (news aggregator, simple blog, landing generator, corporate site).
 */

/** Feature flags — control what modules are compiled into the admin and exposed via API. */
export interface FeatureFlags {
  /** News pipeline: Articles + Sources + Categories + collectors + approval queue. */
  news: boolean;
  /** Landing page builder: LandingPages collection + /api/landing-pages/generate. */
  landingPages: boolean;
  /** Trend detection: /api/trends + TrendsPanel admin widget. */
  trends: boolean;
  /** AI providers & content generation (Anthropic/Gemini/OpenAI). */
  ai: boolean;
  /** Site analyzer/cloner (scrape DOM, palette, integrations, schemas). */
  analyzer: boolean;
  /** Advanced SEO editor — schema.org, automatic sitemap, full OG/Twitter. */
  seoAdvanced: boolean;
  /** Inline article editor that replaces Payload's default detail view. */
  inlineEditor: boolean;
  /** Google Tag Manager / GA4 admin panel. */
  googleTags: boolean;
}

/** Branding — admin UI chrome. */
export interface BrandingConfig {
  siteName: string;
  titleSuffix: string;
  description: string;
  /** Absolute URL or /public path, used in OG image fallbacks and sitemap. */
  defaultOgImage?: string;
  primaryColor?: string;
}

/** SEO defaults shared across pages when per-item values are missing. */
export interface SeoDefaults {
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  twitterHandle?: string;
  /** Used in schema.org Organization node. */
  organization?: {
    name: string;
    logoUrl?: string;
    sameAs?: string[];
  };
}

/** Supported Payload locales for this deployment. */
export interface LocaleConfig {
  locales: { label: string; code: string }[];
  defaultLocale: string;
  fallback: boolean;
}

export interface SiteProfile {
  /** Stable id used as the key when resolving profiles by env var. */
  id: string;
  /** Human-readable label shown in logs. */
  label: string;
  features: FeatureFlags;
  branding: BrandingConfig;
  seo: SeoDefaults;
  localization: LocaleConfig;
}

export type FeatureName = keyof FeatureFlags;
