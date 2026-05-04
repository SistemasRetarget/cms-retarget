/**
 * Colectores para redes sociales — Instagram, TikTok, Twitter/X, Facebook.
 *
 * Estrategia sin API key:
 *  - TikTok  → oEmbed (title + author, sin auth)
 *  - Twitter → oEmbed publish.twitter.com (texto completo, sin auth)
 *  - Instagram → oEmbed basic (requiere token Meta para contenido completo;
 *                sin token devuelve solo autor y URL)
 *  - Facebook → oEmbed (requiere token para full; sin token: limitado)
 *
 * Con token de Meta App (opcional en SocialSettings):
 *  - Instagram y Facebook entregan caption, media_url, timestamp
 */

import type { CollectedItem } from "./types";

const UA = "Mozilla/5.0 (compatible; NewsAICMS/1.0)";
const TIMEOUT = 10000;

// ── TikTok ──────────────────────────────────────────────────────────

interface TikTokOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

export async function collectFromTikTok(url: string): Promise<CollectedItem | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT) }
    );
    if (!res.ok) throw new Error(`TikTok oEmbed ${res.status}`);
    const data: TikTokOEmbed = await res.json();

    const title = data.title || "";
    const author = data.author_name || "";
    if (!title && !author) return null;

    return {
      title: title || `Video de ${author}`,
      content: `${title}\n\nAutor: @${author}\n\nVideo de TikTok. URL: ${url}`,
      url,
      platform: "tiktok",
      mediaType: "reel",
      author,
      thumbnail: data.thumbnail_url
    };
  } catch (e) {
    throw new Error(`TikTok: ${(e as Error).message}`);
  }
}

// ── Twitter / X ─────────────────────────────────────────────────────

interface TwitterOEmbed {
  html?: string;
  author_name?: string;
  author_url?: string;
}

function extractTweetText(html: string): string {
  // El HTML del oEmbed incluye el texto del tweet en el <p>
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return "";
  return m[1]
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .trim();
}

export async function collectFromTwitter(url: string): Promise<CollectedItem | null> {
  // Normalizar URLs de X a twitter.com para el oEmbed
  const normalizedUrl = url.replace("x.com", "twitter.com");
  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(normalizedUrl)}&omit_script=true`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT) }
    );
    if (!res.ok) throw new Error(`Twitter oEmbed ${res.status}`);
    const data: TwitterOEmbed = await res.json();

    const text = data.html ? extractTweetText(data.html) : "";
    const author = data.author_name || "";
    if (!text && !author) return null;

    return {
      title: text.slice(0, 120) || `Tweet de @${author}`,
      content: `Tweet de @${author}:\n\n${text}\n\nURL: ${url}`,
      url,
      platform: "twitter",
      mediaType: "post",
      author
    };
  } catch (e) {
    throw new Error(`Twitter/X: ${(e as Error).message}`);
  }
}

// ── Instagram ───────────────────────────────────────────────────────

interface InstagramOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

export async function collectFromInstagram(
  url: string,
  metaToken?: string
): Promise<CollectedItem | null> {
  // Con token de Meta Graph API → más datos
  if (metaToken) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${metaToken}&fields=title,author_name,thumbnail_url,html`,
        { signal: AbortSignal.timeout(TIMEOUT) }
      );
      if (res.ok) {
        const data: InstagramOEmbed = await res.json();
        const author = data.author_name || "";
        const caption = data.title || data.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
        const isReel = url.includes("/reel/");

        return {
          title: caption.slice(0, 150) || `${isReel ? "Reel" : "Post"} de @${author}`,
          content: `${isReel ? "Reel" : "Post"} de @${author} en Instagram:\n\n${caption}\n\nURL: ${url}`,
          url,
          platform: "instagram",
          mediaType: url.includes("/reel/") ? "reel" : "post",
          author,
          thumbnail: data.thumbnail_url
        };
      }
    } catch { /* fallback sin token */ }
  }

  // Sin token — intento oEmbed básico (puede requerir auth en cuentas nuevas)
  try {
    const res = await fetch(
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT) }
    );
    if (res.ok) {
      const data: InstagramOEmbed = await res.json();
      const author = data.author_name || "";
      const caption = data.title || "";
      const isReel = url.includes("/reel/");

      return {
        title: caption.slice(0, 150) || `${isReel ? "Reel" : "Post"} de @${author}`,
        content: `${isReel ? "Reel" : "Post"} de @${author} en Instagram:\n\n${caption}\n\nURL: ${url}`,
        url,
        platform: "instagram",
        mediaType: isReel ? "reel" : "post",
        author,
        thumbnail: data.thumbnail_url
      };
    }
  } catch { /* sin resultados */ }

  // Último recurso: artículo básico con lo que tenemos de la URL
  const isReel = url.includes("/reel/");
  return {
    title: `${isReel ? "Reel" : "Publicación"} de Instagram`,
    content: `Contenido de Instagram. URL: ${url}\n\nNota: Para obtener el contenido completo configura el Meta App Token en Social Settings.`,
    url,
    platform: "instagram",
    mediaType: isReel ? "reel" : "post"
  };
}

// ── Facebook ─────────────────────────────────────────────────────────

interface FacebookOEmbed {
  title?: string;
  author_name?: string;
  html?: string;
  thumbnail_url?: string;
}

export async function collectFromFacebook(
  url: string,
  metaToken?: string
): Promise<CollectedItem | null> {
  if (!metaToken) {
    return {
      title: "Publicación de Facebook",
      content: `Publicación de Facebook. URL: ${url}\n\nNota: Configura el Meta App Token en Social Settings para obtener el contenido.`,
      url,
      platform: "facebook",
      mediaType: "post"
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/oembed_post?url=${encodeURIComponent(url)}&access_token=${metaToken}`,
      { signal: AbortSignal.timeout(TIMEOUT) }
    );
    if (!res.ok) throw new Error(`Facebook oEmbed ${res.status}`);
    const data: FacebookOEmbed = await res.json();

    const text = data.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
    const author = data.author_name || "";

    return {
      title: data.title || text.slice(0, 120) || `Post de ${author}`,
      content: `Publicación de Facebook por ${author}:\n\n${text}\n\nURL: ${url}`,
      url,
      platform: "facebook",
      mediaType: "post",
      author,
      thumbnail: data.thumbnail_url
    };
  } catch (e) {
    throw new Error(`Facebook: ${(e as Error).message}`);
  }
}
