/**
 * Site analyzer types — describes the "blueprint" that the analyzer produces
 * from any public URL. This blueprint is consumed by:
 *   - Landing-page generator (clone a competitor's structure)
 *   - Audit reports for agency clients
 *   - Migration helper (move a WordPress site into this CMS)
 */

export type TrackerId =
  | "ga4"
  | "ua"
  | "gtm"
  | "meta_pixel"
  | "tiktok_pixel"
  | "linkedin_insight"
  | "twitter_pixel"
  | "pinterest_tag"
  | "reddit_pixel"
  | "snapchat_pixel"
  | "hotjar"
  | "clarity"
  | "segment"
  | "mixpanel"
  | "amplitude"
  | "plausible"
  | "fathom"
  | "matomo"
  | "intercom"
  | "drift"
  | "crisp"
  | "zendesk"
  | "hubspot"
  | "cookiebot"
  | "onetrust"
  | "google_ads"
  | "bing_ads"
  | "recaptcha"
  | "turnstile";

export type IntegrationCategory =
  | "analytics"
  | "ads"
  | "chat"
  | "cmp"
  | "tagmanager"
  | "captcha"
  | "crm";

export interface DetectedIntegration {
  id: TrackerId;
  label: string;
  category: IntegrationCategory;
  /** Extracted id/token, when detectable (e.g. GA4 measurement id, FB pixel id). */
  accountId?: string;
  /** Source evidence — script src or snippet that matched. */
  evidence?: string;
}

export interface TechHint {
  framework?: string;
  cms?: string;
  generator?: string;
  hostedBy?: string;
}

export interface PaletteEntry {
  hex: string;
  /** 0..1 — approximate prominence. */
  score: number;
  /** Where the color came from — "css-var", "inline", "meta-theme". */
  source: string;
}

export interface TypographyEntry {
  family: string;
  source: "google" | "adobe" | "bunny" | "custom" | "system";
  href?: string;
}

export interface SchemaOrgNode {
  "@type"?: string | string[];
  raw: unknown;
}

export interface MetaSummary {
  title?: string;
  description?: string;
  canonical?: string;
  language?: string;
  favicon?: string;
  themeColor?: string;
  viewport?: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
}

export interface StructureHeading {
  level: 1 | 2 | 3;
  text: string;
}

export interface StructureLink {
  label: string;
  href: string;
}

export interface StructureSummary {
  headings: StructureHeading[];
  navLinks: StructureLink[];
  footerLinks: StructureLink[];
  hasHero: boolean;
  hasCTA: boolean;
  totalImages: number;
  totalForms: number;
  totalSections: number;
}

export interface SiteBlueprint {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  meta: MetaSummary;
  structure: StructureSummary;
  integrations: DetectedIntegration[];
  palette: PaletteEntry[];
  typography: TypographyEntry[];
  tech: TechHint;
  schemaOrg: SchemaOrgNode[];
  /** Raw byte-size of the HTML. */
  htmlSize: number;
  /** Short AI-friendly summary that can be fed to the landing generator. */
  summary: string;
}
