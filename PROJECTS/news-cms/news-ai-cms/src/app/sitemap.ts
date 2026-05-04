import type { MetadataRoute } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { getActiveProfile } from "@/site-profiles";

/**
 * Automatic sitemap — aggregates:
 *   - Home
 *   - All published articles (if `news` or `inlineEditor` feature is on)
 *   - All published landings (if `landingPages` feature is on)
 *   - All categories
 *
 * Output is ISR-revalidated by Next.js on each request; Payload cache keeps
 * fetches cheap. Safe to expose publicly.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl.replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1.0 },
  ];

  try {
    const payload = await getPayload({ config });

    const hasArticles = profile.features.news || profile.features.inlineEditor;
    if (hasArticles) {
      const res = await payload.find({
        collection: "articles",
        where: { status: { equals: "published" } },
        limit: 5000,
        sort: "-publishedAt",
        depth: 0,
      });
      for (const a of res.docs) {
        const art = a as { slug?: string; updatedAt?: string; publishedAt?: string; meta?: { noindex?: boolean } };
        if (!art.slug || art.meta?.noindex) continue;
        entries.push({
          url: `${base}/articulo/${art.slug}`,
          lastModified: art.updatedAt || art.publishedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }

      const cats = await payload.find({ collection: "categories", limit: 500, depth: 0 });
      for (const c of cats.docs) {
        const cat = c as { slug?: string; updatedAt?: string };
        if (!cat.slug) continue;
        entries.push({
          url: `${base}/categoria/${cat.slug}`,
          lastModified: cat.updatedAt,
          changeFrequency: "daily",
          priority: 0.5,
        });
      }
    }

    if (profile.features.landingPages) {
      const res = await payload.find({
        collection: "landing-pages",
        where: { status: { equals: "published" } },
        limit: 1000,
        depth: 0,
      });
      for (const l of res.docs) {
        const lp = l as { slug?: string; updatedAt?: string; meta?: { noindex?: boolean } };
        if (!lp.slug || lp.meta?.noindex) continue;
        entries.push({
          url: `${base}/landing/${lp.slug}`,
          lastModified: lp.updatedAt,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // DB not ready — home entry is enough to avoid a 500
  }

  return entries;
}
