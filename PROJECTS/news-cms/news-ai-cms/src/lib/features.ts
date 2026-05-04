/**
 * Feature flag helpers backed by the active site profile.
 * Use these inside API routes, server components, and middleware.
 */
import { NextResponse } from "next/server";
import { getActiveProfile, isFeatureEnabled, type FeatureName } from "@/site-profiles";

export { isFeatureEnabled, getActiveProfile };

/**
 * Guard an API handler: if the feature is disabled for the active profile,
 * returns a 404 NextResponse. Callers must `return` the result when truthy.
 *
 * Example:
 *   const gate = requireFeature("trends");
 *   if (gate) return gate;
 *   // ...normal handler logic
 */
export function requireFeature(feature: FeatureName): NextResponse | null {
  if (isFeatureEnabled(feature)) return null;
  return NextResponse.json(
    {
      error: "feature_disabled",
      feature,
      profile: getActiveProfile().id,
      message: `La funcionalidad "${feature}" no está habilitada en este sitio.`,
    },
    { status: 404 }
  );
}

/** Throw-version for server components where a NextResponse doesn't fit. */
export function assertFeature(feature: FeatureName): void {
  if (!isFeatureEnabled(feature)) {
    throw new Error(`Feature "${feature}" disabled for profile ${getActiveProfile().id}`);
  }
}
