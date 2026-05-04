import { stripUndefined } from "@/lib/seo/schema";

/**
 * Server-rendered JSON-LD injector. Accepts one object or an array — the
 * component emits one <script type="application/ld+json"> per node so crawlers
 * parse each independently.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(stripUndefined(node)) }}
        />
      ))}
    </>
  );
}
