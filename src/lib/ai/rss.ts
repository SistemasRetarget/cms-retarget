/**
 * Parser simple de RSS/Atom (sin dependencias extra).
 * Limita resultados y extrae título, link, descripción y fecha.
 */

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  guid?: string;
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1").trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pick(src: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = src.match(re);
  return m ? decode(m[1]) : "";
}

export async function fetchRSS(url: string, max = 10): Promise<RSSItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "NewsAICMS/1.0 (+https://github.com/news-ai-cms)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
    },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`RSS ${res.status} @ ${url}`);
  const xml = await res.text();

  // Detecta Atom vs RSS
  const isAtom = /<feed\b/i.test(xml);
  const itemTag = isAtom ? "entry" : "item";
  const blocks = xml.match(new RegExp(`<${itemTag}[^>]*>[\\s\\S]*?<\\/${itemTag}>`, "gi")) || [];

  return blocks.slice(0, max).map((b) => {
    const title = stripHtml(pick(b, "title"));
    // Atom: <link href="..."/> · RSS: <link>...</link>
    let link = pick(b, "link");
    if (!link && isAtom) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      if (m) link = m[1];
    }
    const description = stripHtml(
      pick(b, "content:encoded") || pick(b, "content") || pick(b, "description") || pick(b, "summary")
    );
    const pubDate = pick(b, "pubDate") || pick(b, "published") || pick(b, "updated");
    const guid = pick(b, "guid") || pick(b, "id") || link;
    return { title, link, description, pubDate, guid };
  }).filter((i) => i.title && i.link);
}
