/**
 * Helpers to convert between plain-text (editor-friendly) and the Lexical
 * JSON shape Payload expects for richText fields.
 *
 * Round-trip is not lossless — rich formatting (bold, lists, links) is
 * dropped when going to plain text. That's acceptable for the inline quick
 * editor; anything complex should use Payload's full Lexical view.
 */

interface LexicalTextNode {
  type: "text";
  text: string;
  version: number;
  format?: number | string;
  style?: string;
  mode?: string;
}

interface LexicalParagraph {
  type: "paragraph";
  version: number;
  children: LexicalTextNode[];
  format?: string;
  direction?: string | null;
  indent?: number;
}

interface LexicalRoot {
  root: {
    type: "root";
    format: string;
    indent: number;
    version: number;
    direction: string | null;
    children: Array<LexicalParagraph | Record<string, unknown>>;
  };
}

export function plainTextToLexical(body: string): LexicalRoot {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: null,
      children: (paragraphs.length ? paragraphs : [body]).map(
        (text): LexicalParagraph => ({
          type: "paragraph",
          version: 1,
          children: [{ type: "text", text, version: 1 }],
        })
      ),
    },
  };
}

export function lexicalToPlainText(val: unknown): string {
  if (!val || typeof val !== "object") return "";
  const node = val as { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } };
  const children = node?.root?.children || [];
  return children
    .map((p) => (p.children || []).map((c) => c.text || "").join(""))
    .filter(Boolean)
    .join("\n\n");
}
