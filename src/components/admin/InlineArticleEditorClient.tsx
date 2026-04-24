"use client";
import React, { useState } from "react";
import { plainTextToLexical } from "@/lib/lexical";

/**
 * Inline editor — client form.
 *
 * Minimal UI tuned for quick edits: title, slug, excerpt, body (plain text),
 * category, status, SEO group. Saves via PATCH to Payload's REST API, which
 * runs all hooks, validation and access control server-side — so it's the
 * same level of safety as Payload's native admin.
 *
 * Rich-text body is round-tripped through `plainTextToLexical` /
 * `lexicalToPlainText`: fast to type, but formatting (bold, lists, links)
 * is lost. For complex articles, the "Editor avanzado" link takes the user
 * to the versions tab, where the full Lexical editor is still available.
 */

type CategoryOpt = { id: string | number; name: string; slug?: string };

type InitialData = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl?: string;
  categoryId: string;
  status: string;
  publishedAt: string | null;
  sourceUrl: string;
  tags: string[];
  meta: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
    ogType: string;
    twitterCard: string;
    structuredDataType: string;
    noindex: boolean;
    nofollow: boolean;
  };
};

type Props = {
  articleId: string;
  initial: InitialData;
  categories: CategoryOpt[];
};

type SaveState = "idle" | "saving" | "ok" | "error";

const STATUS_OPTS = [
  { label: "Borrador", value: "draft" },
  { label: "En revisión", value: "review" },
  { label: "Publicado", value: "published" },
];

const OG_TYPES = [
  { label: "article", value: "article" },
  { label: "website", value: "website" },
  { label: "product", value: "product" },
  { label: "profile", value: "profile" },
];

const SCHEMA_TYPES = [
  { label: "NewsArticle (noticia)", value: "NewsArticle" },
  { label: "Article (genérico)", value: "Article" },
  { label: "BlogPosting (blog)", value: "BlogPosting" },
  { label: "WebPage (landing)", value: "WebPage" },
  { label: "Product", value: "Product" },
  { label: "FAQPage", value: "FAQPage" },
];

const COLORS = {
  bg: "#faf8f4",
  border: "#e8dfd0",
  borderStrong: "#d4c4a8",
  text: "#2c2419",
  muted: "#6b5842",
  mutedLight: "#8b7355",
  accent: "#8b7355",
  accentDark: "#6b5842",
  ok: "#4a7c3a",
  okLight: "#e6f0df",
  err: "#c0392b",
  errLight: "#fde8e8",
};

export default function InlineArticleEditorClient({
  articleId,
  initial,
  categories,
}: Props) {
  const [data, setData] = useState<InitialData>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showSeo, setShowSeo] = useState(false);

  function setField<K extends keyof InitialData>(key: K, val: InitialData[K]) {
    setData((d) => ({ ...d, [key]: val }));
  }

  function setMeta<K extends keyof InitialData["meta"]>(
    key: K,
    val: InitialData["meta"][K]
  ) {
    setData((d) => ({ ...d, meta: { ...d.meta, [key]: val } }));
  }

  async function save() {
    setState("saving");
    setMessage(null);

    const payload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      body: plainTextToLexical(data.body),
      status: data.status,
      category: data.categoryId || null,
      tags: data.tags.map((tag) => ({ tag })),
      meta: {
        title: data.meta.title || null,
        description: data.meta.description || null,
        keywords: data.meta.keywords || null,
        canonical: data.meta.canonical || null,
        ogType: data.meta.ogType,
        twitterCard: data.meta.twitterCard,
        structuredDataType: data.meta.structuredDataType,
        noindex: data.meta.noindex,
        nofollow: data.meta.nofollow,
      },
    };

    if (data.status === "published" && !data.publishedAt) {
      payload.publishedAt = new Date().toISOString();
    }

    try {
      const r = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await r.json().catch(() => ({}))) as {
        errors?: Array<{ message?: string }>;
        message?: string;
      };
      if (!r.ok) {
        const msg =
          json.errors?.[0]?.message ||
          json.message ||
          `HTTP ${r.status}`;
        throw new Error(msg);
      }
      setState("ok");
      setMessage("Guardado correctamente.");
      // Clear success toast after a few seconds.
      setTimeout(() => {
        setState((s) => (s === "ok" ? "idle" : s));
        setMessage((m) => (m === "Guardado correctamente." ? null : m));
      }, 3500);
    } catch (e) {
      setState("error");
      setMessage((e as Error).message);
    }
  }

  const tagsText = data.tags.join(", ");

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: COLORS.text,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          paddingBottom: 12,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "1.7rem",
              margin: 0,
              color: COLORS.text,
            }}
          >
            Editor rápido
          </h1>
          <p
            style={{
              margin: "0.25rem 0 0",
              color: COLORS.muted,
              fontSize: "0.92rem",
            }}
          >
            Cambios guardados vía REST de Payload — pasan por todos los hooks,
            validaciones y permisos. Para formato rico, usá la pestaña{" "}
            <em>Versiones</em>.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {data.sourceUrl && (
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.82rem",
                color: COLORS.mutedLight,
                textDecoration: "none",
                padding: "0.45rem 0.9rem",
                border: `1px solid ${COLORS.borderStrong}`,
                borderRadius: 6,
              }}
            >
              Ver fuente ↗
            </a>
          )}
          <a
            href={`/articulo/${data.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.82rem",
              color: COLORS.mutedLight,
              textDecoration: "none",
              padding: "0.45rem 0.9rem",
              border: `1px solid ${COLORS.borderStrong}`,
              borderRadius: 6,
            }}
          >
            Ver en sitio ↗
          </a>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 280px",
          gap: "1.5rem",
        }}
      >
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Field label="Título">
            <input
              type="text"
              value={data.title}
              onChange={(e) => setField("title", e.target.value)}
              style={inputStyle}
              maxLength={200}
            />
          </Field>

          <Field
            label="Slug"
            hint="URL amigable. Evitá cambiarlo si el artículo ya está publicado (rompe enlaces)."
          >
            <input
              type="text"
              value={data.slug}
              onChange={(e) => setField("slug", e.target.value)}
              style={{ ...inputStyle, fontFamily: "monospace" }}
            />
          </Field>

          <Field label="Bajada (excerpt)" hint="2–3 líneas que resumen la nota.">
            <textarea
              value={data.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)}
              rows={3}
              maxLength={300}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field
            label="Cuerpo"
            hint="Texto plano. Párrafos separados por línea en blanco. El formato rico se pierde al guardar — usá 'Versiones' para edición avanzada."
          >
            <textarea
              value={data.body}
              onChange={(e) => setField("body", e.target.value)}
              rows={18}
              style={{
                ...inputStyle,
                fontFamily: "Georgia, serif",
                fontSize: "1rem",
                lineHeight: 1.55,
                resize: "vertical",
                minHeight: 360,
              }}
            />
          </Field>

          <Field
            label="Tags"
            hint="Separados por coma. Ej: política, chile, congreso."
          >
            <input
              type="text"
              value={tagsText}
              onChange={(e) =>
                setField(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
              style={inputStyle}
            />
          </Field>

          {/* SEO toggle */}
          <div
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: showSeo ? "1rem 1.1rem" : "0.6rem 1.1rem",
            }}
          >
            <button
              type="button"
              onClick={() => setShowSeo((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                color: COLORS.accentDark,
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                padding: 0,
                width: "100%",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>SEO y metadatos</span>
              <span style={{ color: COLORS.muted, fontSize: "0.85rem" }}>
                {showSeo ? "▲ ocultar" : "▼ mostrar"}
              </span>
            </button>

            {showSeo && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.9rem",
                  marginTop: "1rem",
                }}
              >
                <Field label="Meta título" hint="Máx. 120, pisa el título.">
                  <input
                    type="text"
                    value={data.meta.title}
                    maxLength={120}
                    onChange={(e) => setMeta("title", e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field
                  label="Meta descripción"
                  hint="Máx. 240, pisa la bajada."
                >
                  <textarea
                    value={data.meta.description}
                    onChange={(e) => setMeta("description", e.target.value)}
                    rows={2}
                    maxLength={240}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>

                <Field label="Keywords">
                  <input
                    type="text"
                    value={data.meta.keywords}
                    onChange={(e) => setMeta("keywords", e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field
                  label="Canonical URL"
                  hint="Sólo si querés apuntar a otra URL como fuente."
                >
                  <input
                    type="url"
                    value={data.meta.canonical}
                    onChange={(e) => setMeta("canonical", e.target.value)}
                    style={{ ...inputStyle, fontFamily: "monospace" }}
                  />
                </Field>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.9rem",
                  }}
                >
                  <Field label="Open Graph type">
                    <select
                      value={data.meta.ogType}
                      onChange={(e) => setMeta("ogType", e.target.value)}
                      style={inputStyle}
                    >
                      {OG_TYPES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Schema.org @type">
                    <select
                      value={data.meta.structuredDataType}
                      onChange={(e) =>
                        setMeta("structuredDataType", e.target.value)
                      }
                      style={inputStyle}
                    >
                      {SCHEMA_TYPES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <Checkbox
                    label="No indexar (noindex)"
                    checked={data.meta.noindex}
                    onChange={(v) => setMeta("noindex", v)}
                  />
                  <Checkbox
                    label="No seguir enlaces (nofollow)"
                    checked={data.meta.nofollow}
                    onChange={(v) => setMeta("nofollow", v)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            alignSelf: "start",
            position: "sticky",
            top: "1rem",
          }}
        >
          <div
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "1rem",
            }}
          >
            <Field label="Estado">
              <select
                value={data.status}
                onChange={(e) => setField("status", e.target.value)}
                style={inputStyle}
              >
                {STATUS_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ marginTop: "0.9rem" }}>
              <Field label="Categoría">
                <select
                  value={data.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Sin categoría —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {data.coverImageUrl && (
              <div style={{ marginTop: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: COLORS.muted,
                    marginBottom: 6,
                  }}
                >
                  Portada actual
                </label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.coverImageUrl}
                  alt="Portada"
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    border: `1px solid ${COLORS.border}`,
                  }}
                />
                <p
                  style={{
                    margin: "0.4rem 0 0",
                    fontSize: "0.78rem",
                    color: COLORS.mutedLight,
                  }}
                >
                  Cambiar portada: usá la pestaña <em>API</em> o el editor
                  avanzado.
                </p>
              </div>
            )}

            {data.publishedAt && (
              <p
                style={{
                  margin: "0.9rem 0 0",
                  fontSize: "0.78rem",
                  color: COLORS.mutedLight,
                }}
              >
                Publicado:{" "}
                {new Date(data.publishedAt).toLocaleString("es-CL", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={state === "saving"}
            style={{
              background:
                state === "saving" ? COLORS.mutedLight : COLORS.accent,
              color: "#fff",
              border: "none",
              padding: "0.9rem 1rem",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: state === "saving" ? "wait" : "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              boxShadow: "0 4px 12px -3px rgba(139,115,85,0.45)",
            }}
          >
            {state === "saving" ? "Guardando…" : "Guardar cambios"}
          </button>

          {state === "ok" && message && (
            <div
              style={{
                background: COLORS.okLight,
                border: `1px solid ${COLORS.ok}`,
                color: "#2f5a23",
                padding: "0.6rem 0.8rem",
                borderRadius: 6,
                fontSize: "0.88rem",
              }}
            >
              ✓ {message}
            </div>
          )}

          {state === "error" && message && (
            <div
              style={{
                background: COLORS.errLight,
                border: `1px solid ${COLORS.err}`,
                color: "#8b1f15",
                padding: "0.6rem 0.8rem",
                borderRadius: 6,
                fontSize: "0.88rem",
              }}
            >
              <strong>Error:</strong> {message}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  border: `1px solid ${COLORS.borderStrong}`,
  borderRadius: 6,
  fontSize: "0.95rem",
  fontFamily: "inherit",
  color: COLORS.text,
  background: "#fff",
  boxSizing: "border-box",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: "0.82rem",
          fontWeight: 600,
          color: COLORS.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          style={{
            display: "block",
            fontSize: "0.78rem",
            color: COLORS.mutedLight,
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.88rem",
        color: COLORS.text,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: COLORS.accent }}
      />
      {label}
    </label>
  );
}
