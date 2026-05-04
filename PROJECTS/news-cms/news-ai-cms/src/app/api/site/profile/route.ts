import { jsonWithETag } from "@/lib/etag";
import { getActiveProfile } from "@/site-profiles";

/**
 * Public profile endpoint — exposes the active site's features and branding
 * so client components can render conditionally.
 *
 * Does NOT expose secrets — only id, label, features, branding (non-sensitive).
 */
export function GET(req: Request) {
  const p = getActiveProfile();
  return jsonWithETag(
    req,
    {
      id: p.id,
      label: p.label,
      features: p.features,
      branding: p.branding,
      seo: {
        siteUrl: p.seo.siteUrl,
        defaultTitle: p.seo.defaultTitle,
        defaultDescription: p.seo.defaultDescription,
        twitterHandle: p.seo.twitterHandle,
      },
    },
    { maxAge: 300, sMaxAge: 3600, staleWhileRevalidate: 7200 }
  );
}
