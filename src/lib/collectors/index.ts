/**
 * Dispatcher unificado de colectores.
 * Recibe una URL + tipo y devuelve CollectedItem[].
 */

import { fetchRSS } from "@/lib/ai/rss";
import { scrapeHTML } from "./html";
import { collectFromSitemap } from "./sitemap";
import { collectFromYouTubeChannel, collectFromYouTubeVideo } from "./youtube";
import { collectFromTikTok, collectFromTwitter, collectFromInstagram, collectFromFacebook } from "./social";
import { detectUrlType } from "./url-detector";
import type { CollectedItem, SourceType } from "./types";

export type { CollectedItem, SourceType };

export interface CollectOptions {
  max?: number;
  metaToken?: string;   // Meta App Token para Instagram/Facebook
  language?: string;
}

/** Convierte RSSItem al formato CollectedItem */
function rssToCollected(items: Awaited<ReturnType<typeof fetchRSS>>): CollectedItem[] {
  return items.map((i) => ({
    title: i.title,
    content: i.description || i.title,
    url: i.link,
    platform: "rss" as const,
    mediaType: "article" as const,
    publishedAt: i.pubDate
  }));
}

/**
 * Función principal: recolecta items de cualquier URL/tipo.
 * Devuelve siempre un array (vacío si falla todo).
 */
export async function collect(
  url: string,
  type: SourceType | "auto",
  options: CollectOptions = {}
): Promise<CollectedItem[]> {
  const { max = 5, metaToken, language } = options;
  const resolvedType = type === "auto" || type === "url_auto" ? detectUrlType(url) : type;

  switch (resolvedType) {
    case "rss": {
      const items = await fetchRSS(url, max);
      return rssToCollected(items);
    }

    case "html": {
      const item = await scrapeHTML(url);
      return item ? [item] : [];
    }

    case "sitemap": {
      return collectFromSitemap(url, max);
    }

    case "youtube_channel": {
      return collectFromYouTubeChannel(url, max);
    }

    case "youtube_video": {
      const item = await collectFromYouTubeVideo(url);
      return item ? [item] : [];
    }

    case "instagram": {
      const item = await collectFromInstagram(url, metaToken);
      return item ? [item] : [];
    }

    case "tiktok": {
      const item = await collectFromTikTok(url);
      return item ? [item] : [];
    }

    case "twitter": {
      const item = await collectFromTwitter(url);
      return item ? [item] : [];
    }

    case "facebook": {
      const item = await collectFromFacebook(url, metaToken);
      return item ? [item] : [];
    }

    default:
      throw new Error(`Tipo de fuente no soportado: ${resolvedType}`);
  }
}
