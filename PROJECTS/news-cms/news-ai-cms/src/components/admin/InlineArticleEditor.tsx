import React from "react";
import type { DocumentViewServerProps } from "payload";
import { Gutter } from "@payloadcms/ui";
import InlineArticleEditorClient from "./InlineArticleEditorClient";
import { lexicalToPlainText } from "@/lib/lexical";
import { getActiveProfile } from "@/site-profiles";

/**
 * Server wrapper for the inline article editor.
 *
 * Replaces Payload's default `/admin/collections/articles/:id` edit view when
 * the active site profile has `features.inlineEditor === true`.
 *
 * Responsibilities of the server layer:
 *   - Pull fresh `doc` from the server props (already loaded by Payload).
 *   - Fetch the list of categories so the select can render SSR-first.
 *   - Convert the Lexical `body` to a plain-text string editors can type in.
 *   - Hand off to the client form.
 *
 * The full Payload edit experience (rich Lexical toolbar, version diffs,
 * localized fields per locale) remains available via the other tabs of the
 * document view: `/api`, `/versions`, `/preview`, etc. We only override
 * `default`, not `root`.
 */

type CategoryOpt = { id: string | number; name: string; slug?: string };

type ArticleDoc = {
  id?: string | number;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: unknown;
  coverImage?: { id?: string | number; url?: string } | string | number | null;
  category?: { id?: string | number } | string | number | null;
  status?: string;
  publishedAt?: string | null;
  tags?: Array<{ tag?: string }>;
  sourceUrl?: string;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    ogImage?: { id?: string | number; url?: string } | string | number | null;
    ogType?: string;
    twitterCard?: string;
    structuredDataType?: string;
    noindex?: boolean;
    nofollow?: boolean;
  };
};

const InlineArticleEditor: React.FC<DocumentViewServerProps> = async (props) => {
  const profile = getActiveProfile();
  const { doc, initPageResult, routeSegments } = props;

  // Guardrail: if the feature flag is disabled at runtime, bail out early.
  // In practice Articles.ts only wires this view when the flag is on, but
  // defending here means a misconfigured deployment still renders something
  // useful instead of a blank page.
  if (!profile.features.inlineEditor) {
    return (
      <Gutter>
        <div style={{ padding: "2rem 0" }}>
          <p style={{ color: "#8b7355" }}>
            Editor inline desactivado en este perfil. Volvé a habilitar la
            feature <code>inlineEditor</code> en <code>site-profiles/</code>.
          </p>
        </div>
      </Gutter>
    );
  }

  const article = (doc || {}) as ArticleDoc;
  const articleId =
    article.id ?? routeSegments[routeSegments.length - 1] ?? "";

  // Load categories once on the server so the dropdown is hydrated without
  // an extra client round-trip. depth=0 skips joins we don't use.
  let categories: CategoryOpt[] = [];
  try {
    const req = initPageResult?.req;
    if (req?.payload) {
      const res = await req.payload.find({
        collection: "categories",
        limit: 200,
        depth: 0,
        sort: "name",
      });
      categories = res.docs.map((c) => {
        const cat = c as { id: string | number; name?: string; slug?: string };
        return { id: cat.id, name: cat.name || String(cat.id), slug: cat.slug };
      });
    }
  } catch {
    // Categories collection may be disabled in profiles that don't ship news
    // — the client form handles an empty list gracefully.
  }

  const bodyText = lexicalToPlainText(article.body);

  const currentCategoryId =
    typeof article.category === "object" && article.category !== null
      ? (article.category as { id?: string | number }).id
      : (article.category as string | number | null | undefined);

  const coverImageUrl =
    typeof article.coverImage === "object" && article.coverImage !== null
      ? (article.coverImage as { url?: string }).url
      : undefined;

  return (
    <Gutter>
      <div style={{ padding: "1.5rem 0 3rem" }}>
        <InlineArticleEditorClient
          articleId={String(articleId)}
          initial={{
            title: article.title || "",
            slug: article.slug || "",
            excerpt: article.excerpt || "",
            body: bodyText,
            coverImageUrl,
            categoryId: currentCategoryId ? String(currentCategoryId) : "",
            status: (article.status as string) || "draft",
            publishedAt: article.publishedAt || null,
            sourceUrl: article.sourceUrl || "",
            tags: (article.tags || [])
              .map((t) => t.tag || "")
              .filter(Boolean),
            meta: {
              title: article.meta?.title || "",
              description: article.meta?.description || "",
              keywords: article.meta?.keywords || "",
              canonical: article.meta?.canonical || "",
              ogType: article.meta?.ogType || "article",
              twitterCard:
                article.meta?.twitterCard || "summary_large_image",
              structuredDataType:
                article.meta?.structuredDataType || "NewsArticle",
              noindex: Boolean(article.meta?.noindex),
              nofollow: Boolean(article.meta?.nofollow),
            },
          }}
          categories={categories}
        />
      </div>
    </Gutter>
  );
};

export default InlineArticleEditor;
