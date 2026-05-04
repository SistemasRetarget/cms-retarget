/**
 * Collector de YouTube — sin API key.
 *
 * Canal  → RSS feed de YouTube (gratis, sin auth)
 * Video  → oEmbed + scraping de descripción de la página
 * Shorts → igual que video
 */

import { fetchRSS } from "@/lib/ai/rss";
import { scrapeHTML } from "./html";
import { extractYoutubeVideoId, youtubeChannelToRSS } from "./url-detector";
import type { CollectedItem } from "./types";

const UA = "Mozilla/5.0 (compatible; NewsAICMS/1.0)";

interface YTOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

async function getYTOEmbed(videoUrl: string): Promise<YTOEmbed> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

async function resolveHandleToChannelId(handle: string): Promise<string | null> {
  // YouTube redirige /@handle → página con channel_id en el HTML
  try {
    const url = `https://www.youtube.com/@${handle}`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/"channelId"\s*:\s*"(UC[A-Za-z0-9_-]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export async function collectFromYouTubeChannel(
  url: string,
  max = 5
): Promise<CollectedItem[]> {
  // Intentar convertir directamente a RSS
  let rssUrl = youtubeChannelToRSS(url);

  if (!rssUrl) {
    // Es un @handle — hay que resolver el channel_id
    const handleMatch = new URL(url).pathname.match(/\/@([^/]+)/);
    if (handleMatch) {
      const channelId = await resolveHandleToChannelId(handleMatch[1]);
      if (channelId) {
        rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      }
    }
  }

  if (!rssUrl) throw new Error(`No se pudo resolver el canal de YouTube: ${url}`);

  const items = await fetchRSS(rssUrl, max);

  return items.map((item) => ({
    title: item.title,
    content: item.description || item.title,
    url: item.link,
    platform: "youtube" as const,
    mediaType: "video" as const,
    publishedAt: item.pubDate,
    author: undefined,
    thumbnail: undefined
  }));
}

export async function collectFromYouTubeVideo(url: string): Promise<CollectedItem | null> {
  const videoId = extractYoutubeVideoId(url);
  const isShort = url.includes("/shorts/");

  // oEmbed para título y autor (sin API key)
  const oembed = await getYTOEmbed(url);

  // Scraping de la página para obtener descripción
  let description = "";
  let thumbnail = oembed.thumbnail_url || "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(12000)
    });
    if (res.ok) {
      const html = await res.text();
      // og:description tiene el snippet de la descripción
      const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*content="([^"]+)"[^>]*name="description"/i) ||
                        html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
      if (descMatch) description = descMatch[1].replace(/&#39;/g, "'").replace(/&amp;/g, "&");

      if (!thumbnail) {
        const thumbMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
        if (thumbMatch) thumbnail = thumbMatch[1];
      }
    }
  } catch { /* usa solo oEmbed */ }

  const title = oembed.title || "";
  const author = oembed.author_name || "";
  const content = description
    ? `${title}\n\nCanal: ${author}\n\n${description}`
    : `${title}\n\nCanal: ${author}\n\nVideo de YouTube${videoId ? ` (${videoId})` : ""}.`;

  if (!title) return null;

  return {
    title,
    content,
    url,
    platform: "youtube",
    mediaType: isShort ? "short" : "video",
    author,
    thumbnail
  };
}
