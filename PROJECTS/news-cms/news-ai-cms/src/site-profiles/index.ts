import { newsAiProfile } from "./news-ai";
import { blogSimpleProfile } from "./blog-simple";
import { agencyProfile } from "./agency";
import type { FeatureName, SiteProfile } from "./types";

export type { SiteProfile, FeatureFlags, FeatureName, BrandingConfig, SeoDefaults, LocaleConfig } from "./types";

/**
 * Profile registry. Add new profiles here and deploy with `SITE_PROFILE=<id>`.
 * Falls back to `news-ai` for backward compatibility with existing deployments.
 */
const REGISTRY: Record<string, SiteProfile> = {
  "news-ai": newsAiProfile,
  "blog-simple": blogSimpleProfile,
  agency: agencyProfile,
};

const DEFAULT_PROFILE_ID = "news-ai";

let cached: SiteProfile | null = null;

/**
 * Resolve the active site profile from the `SITE_PROFILE` env var.
 * Result is memoized per process — profile switches require a restart.
 */
export function getActiveProfile(): SiteProfile {
  if (cached) return cached;
  const id = (process.env.SITE_PROFILE || DEFAULT_PROFILE_ID).trim();
  const profile = REGISTRY[id] || REGISTRY[DEFAULT_PROFILE_ID];
  cached = profile;
  return profile;
}

/** Check whether a feature is enabled on the active profile. */
export function isFeatureEnabled(feature: FeatureName): boolean {
  return getActiveProfile().features[feature] === true;
}

/** List the id of every profile registered — for debugging/CLI. */
export function listProfiles(): string[] {
  return Object.keys(REGISTRY);
}
