import type { CheerioAPI } from "cheerio";
import type { SchemaOrgNode } from "./types";

/**
 * Parse every <script type="application/ld+json"> block.
 * Schema.org is a structured-data vocabulary (NewsArticle, Organization,
 * Product, LocalBusiness, etc.) — if the source site has it, we want to
 * preserve and reuse it for the clone.
 */
export function extractSchemaOrg($: CheerioAPI): SchemaOrgNode[] {
  const nodes: SchemaOrgNode[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const n of parsed) {
          nodes.push({ "@type": n?.["@type"], raw: n });
        }
      } else if (parsed && typeof parsed === "object" && "@graph" in parsed && Array.isArray(parsed["@graph"])) {
        for (const n of parsed["@graph"]) {
          nodes.push({ "@type": n?.["@type"], raw: n });
        }
      } else {
        nodes.push({ "@type": parsed?.["@type"], raw: parsed });
      }
    } catch {
      // skip invalid JSON-LD
    }
  });

  return nodes.slice(0, 30);
}
