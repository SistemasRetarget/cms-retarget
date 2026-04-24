import type { MetadataRoute } from "next";
import { getActiveProfile } from "@/site-profiles";

/**
 * robots.txt — points crawlers at the sitemap and blocks the admin/API paths.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getActiveProfile().seo.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api", "/api/*"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
