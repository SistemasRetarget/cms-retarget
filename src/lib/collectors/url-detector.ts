import type { SourceType } from "./types";

export function detectUrlType(url: string): SourceType {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.toLowerCase();

    // YouTube
    if (host === "youtube.com" || host === "youtu.be") {
      if (
        path.startsWith("/@") ||
        path.startsWith("/channel/") ||
        path.startsWith("/user/") ||
        path.startsWith("/c/")
      ) return "youtube_channel";
      if (u.searchParams.get("v") || host === "youtu.be") return "youtube_video";
      if (path.includes("/shorts/")) return "youtube_video";
      return "youtube_channel";
    }

    // Instagram
    if (host === "instagram.com") return "instagram";

    // TikTok
    if (host === "tiktok.com") return "tiktok";

    // Twitter / X
    if (host === "twitter.com" || host === "x.com") return "twitter";

    // Facebook
    if (host === "facebook.com" || host === "fb.com" || host === "fb.watch") return "facebook";

    // Sitemap
    if (path.endsWith(".xml") || path.includes("sitemap")) return "sitemap";

    // RSS by URL pattern
    if (
      path.includes("feed") || path.includes("rss") || path.includes("atom") ||
      path.endsWith(".rss") || path.endsWith(".atom")
    ) return "rss";

    // Default: scraping HTML
    return "html";
  } catch {
    return "html";
  }
}

/** Convierte una URL de canal de YouTube a su feed RSS */
export function youtubeChannelToRSS(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname;

    // /channel/UCxxxxxx
    const channelMatch = path.match(/\/channel\/(UC[A-Za-z0-9_-]+)/);
    if (channelMatch) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`;
    }

    // /user/username
    const userMatch = path.match(/\/user\/([^/]+)/);
    if (userMatch) {
      return `https://www.youtube.com/feeds/videos.xml?user=${userMatch[1]}`;
    }

    // /@handle — necesita resolución (devolvemos null, se resuelve en el collector)
    return null;
  } catch {
    return null;
  }
}

/** Extrae el video ID de una URL de YouTube */
export function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0];
    if (host === "youtube.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const shortsMatch = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]+)/);
      if (shortsMatch) return shortsMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}
