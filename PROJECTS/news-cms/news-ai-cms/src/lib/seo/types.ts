/**
 * Internal SEO types used by the metadata builders and schema.org generators.
 * These are NOT Payload schema types — they're a narrow view of the subset
 * of document fields the SEO helpers actually care about.
 */

export interface ExtendedMeta {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: { url?: string; alt?: string } | string | null;
  ogType?: "article" | "website" | "product" | "profile";
  twitterCard?: "summary" | "summary_large_image";
  structuredDataType?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface SeoArticle {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt?: string;
  body?: unknown;
  coverImage?: { url?: string; alt?: string } | null;
  category?: { slug?: string; name?: string } | null;
  source?: { name?: string } | null;
  sourceUrl?: string;
  tags?: Array<{ tag: string }> | null;
  meta?: ExtendedMeta;
}

export interface SeoLanding {
  id: string | number;
  title: string;
  slug: string;
  updatedAt?: string;
  sections?: unknown[];
  meta?: ExtendedMeta;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}
