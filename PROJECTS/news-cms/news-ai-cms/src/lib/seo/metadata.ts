import type { Metadata } from "next";
import type { ExtendedMeta, SeoArticle, SeoLanding } from "./types";
import { getActiveProfile } from "@/site-profiles";

/**
 * Next.js `Metadata` builders — consumed by `generateMetadata()` exports on
 * article, landing and category pages.
 *
 * Philosophy:
 *   - Per-document `meta.*` wins
 *   - Falls back to document-intrinsic fields (title, excerpt…)
 *   - Final fallback is the site-profile defaults
 */

function absolute(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

type ImageLike = string | { url?: string; alt?: string } | null | undefined;

function ogImageUrl(image: ImageLike, base: string): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return absolute(image, base);
  if (typeof image === "object" && "url" in image && image.url) {
    return absolute(image.url, base);
  }
  return undefined;
}

/** Restrict ogType to the set Next.js's Metadata type allows. */
type NextOgType = "article" | "website" | "profile";
function narrowOgType(t: ExtendedMeta["ogType"]): NextOgType {
  if (t === "article" || t === "website" || t === "profile") return t;
  return "website";
}

function robotsFor(meta: { noindex?: boolean; nofollow?: boolean } | undefined): Metadata["robots"] {
  const noindex = Boolean(meta?.noindex);
  const nofollow = Boolean(meta?.nofollow);
  return { index: !noindex, follow: !nofollow };
}

export function buildArticleMetadata(article: SeoArticle): Metadata {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl;
  const m = article.meta || {};
  const title = m.title || article.title;
  const description = m.description || article.excerpt || profile.seo.defaultDescription;
  const canonical = m.canonical ? absolute(m.canonical, base) : absolute(`/articulo/${article.slug}`, base);
  const og =
    ogImageUrl(m.ogImage, base) ||
    ogImageUrl(article.coverImage, base) ||
    profile.branding.defaultOgImage;

  return {
    title,
    description,
    keywords: m.keywords,
    alternates: canonical ? { canonical } : undefined,
    robots: robotsFor(m),
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: profile.branding.siteName,
      images: og ? [{ url: og }] : undefined,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      section: article.category?.name,
      tags: article.tags?.map((t) => t.tag),
    },
    twitter: {
      card: m.twitterCard || "summary_large_image",
      title,
      description,
      site: profile.seo.twitterHandle,
      images: og ? [og] : undefined,
    },
  };
}

export function buildLandingMetadata(landing: SeoLanding): Metadata {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl;
  const m = landing.meta || {};
  const title = m.title || landing.title;
  const description = m.description || profile.seo.defaultDescription;
  const canonical = m.canonical ? absolute(m.canonical, base) : absolute(`/landing/${landing.slug}`, base);
  const og = ogImageUrl(m.ogImage, base) || profile.branding.defaultOgImage;

  return {
    title,
    description,
    keywords: m.keywords,
    alternates: canonical ? { canonical } : undefined,
    robots: robotsFor(m),
    openGraph: {
      type: narrowOgType(m.ogType),
      title,
      description,
      url: canonical,
      siteName: profile.branding.siteName,
      images: og ? [{ url: og }] : undefined,
    },
    twitter: {
      card: m.twitterCard || "summary_large_image",
      title,
      description,
      site: profile.seo.twitterHandle,
      images: og ? [og] : undefined,
    },
  };
}

export function buildHomeMetadata(): Metadata {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl;
  const og = profile.branding.defaultOgImage;

  return {
    title: profile.seo.defaultTitle,
    description: profile.seo.defaultDescription,
    alternates: { canonical: base },
    openGraph: {
      type: "website",
      title: profile.seo.defaultTitle,
      description: profile.seo.defaultDescription,
      url: base,
      siteName: profile.branding.siteName,
      images: og ? [{ url: og }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: profile.seo.defaultTitle,
      description: profile.seo.defaultDescription,
      site: profile.seo.twitterHandle,
      images: og ? [og] : undefined,
    },
  };
}

export function buildCategoryMetadata(category: { slug: string; name: string; description?: string }): Metadata {
  const profile = getActiveProfile();
  const base = profile.seo.siteUrl;
  const canonical = absolute(`/categoria/${category.slug}`, base);
  const og = profile.branding.defaultOgImage;

  return {
    title: `${category.name} · ${profile.branding.siteName}`,
    description: category.description || `Artículos de ${category.name} en ${profile.branding.siteName}.`,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      title: category.name,
      description: category.description,
      url: canonical,
      siteName: profile.branding.siteName,
      images: og ? [{ url: og }] : undefined,
    },
  };
}
