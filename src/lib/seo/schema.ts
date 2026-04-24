import type { BreadcrumbItem, SeoArticle, SeoLanding } from "./types";
import { getActiveProfile } from "@/site-profiles";

/**
 * Schema.org / JSON-LD generators. Each helper returns a plain object that
 * the frontend drops inside a <script type="application/ld+json">.
 *
 * https://schema.org/docs/schemas.html — keep nodes minimal; invalid or empty
 * fields hurt rich-result eligibility.
 */

type JsonLd = Record<string, unknown>;

function ctx(node: JsonLd): JsonLd {
  return { "@context": "https://schema.org", ...node };
}

function absolute(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function organizationSchema(): JsonLd {
  const profile = getActiveProfile();
  const org = profile.seo.organization;
  if (!org) {
    return ctx({
      "@type": "Organization",
      name: profile.branding.siteName,
      url: profile.seo.siteUrl,
    });
  }
  return ctx({
    "@type": "Organization",
    name: org.name,
    url: profile.seo.siteUrl,
    logo: org.logoUrl ? { "@type": "ImageObject", url: org.logoUrl } : undefined,
    sameAs: org.sameAs && org.sameAs.length > 0 ? org.sameAs : undefined,
  });
}

export function websiteSchema(): JsonLd {
  const profile = getActiveProfile();
  return ctx({
    "@type": "WebSite",
    name: profile.branding.siteName,
    url: profile.seo.siteUrl,
    inLanguage: profile.localization.defaultLocale,
    description: profile.seo.defaultDescription,
  });
}

export function articleSchema(article: SeoArticle): JsonLd {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl;
  const type = article.meta?.structuredDataType || "NewsArticle";
  const img =
    (typeof article.meta?.ogImage === "object" && article.meta.ogImage?.url) ||
    article.coverImage?.url;
  const url = absolute(`/articulo/${article.slug}`, base);

  return ctx({
    "@type": type,
    headline: article.title,
    description: article.excerpt,
    image: img ? [absolute(img, base)] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    url,
    mainEntityOfPage: url,
    articleSection: article.category?.name,
    keywords: article.tags?.map((t) => t.tag).join(", "),
    publisher: {
      "@type": "Organization",
      name: profile.branding.siteName,
      url: base,
      logo: profile.seo.organization?.logoUrl
        ? { "@type": "ImageObject", url: profile.seo.organization.logoUrl }
        : undefined,
    },
    isBasedOn: article.sourceUrl,
  });
}

export function webPageSchema(landing: SeoLanding): JsonLd {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl;
  const url = absolute(`/landing/${landing.slug}`, base);
  return ctx({
    "@type": landing.meta?.structuredDataType || "WebPage",
    name: landing.meta?.title || landing.title,
    description: landing.meta?.description,
    url,
    dateModified: landing.updatedAt,
    isPartOf: {
      "@type": "WebSite",
      name: profile.branding.siteName,
      url: base,
    },
  });
}

export function breadcrumbSchema(trail: BreadcrumbItem[]): JsonLd {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl;
  return ctx({
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: absolute(item.href, base),
    })),
  });
}

export function faqSchema(items: Array<{ question: string; answer: string }>): JsonLd {
  return ctx({
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  });
}

/** Strip undefined values recursively so JSON-LD output stays tidy. */
export function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => stripUndefined(v)).filter((v) => v !== undefined) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return obj;
}
