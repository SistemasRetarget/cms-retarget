"use client";

import React, { useState } from "react";
import type { SiteBlueprint } from "@/lib/analyzer/types";

const BTN: Record<string, React.CSSProperties> = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0.65rem 1.4rem",
    borderRadius: 8,
    border: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  primary: { backgroundColor: "#8b7355", color: "#fff" },
  secondary: { backgroundColor: "#f0ebe4", color: "#4a3d2c" },
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  border: "1px solid #d8cfc5",
  borderRadius: 6,
  fontSize: "0.9rem",
  color: "#2c2419",
  background: "#fff",
  boxSizing: "border-box",
};

export default function SiteAnalyzerPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<SiteBlueprint | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    if (!url) return;
    setLoading(true);
    setError(null);
    setBlueprint(null);
    try {
      const res = await fetch("/api/analyzer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setBlueprint(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ background: "#fff", border: "2px solid #8b7355", borderRadius: 12, padding: "1.5rem 1.75rem" }}>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", margin: "0 0 0.5rem", color: "#2c2419" }}>
          🔎 Analizar / clonar sitio
        </h3>
        <p style={{ margin: "0 0 1rem", color: "#6b5842", fontSize: "0.95rem" }}>
          Pega la URL de cualquier sitio público. El analizador extrae estructura, paleta, tipografías, scripts de marketing y
          schema.org — útil para auditorías y para clonar competencia en una landing.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={INPUT_STYLE}
            placeholder="https://ejemplo.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runAnalysis();
            }}
          />
          <button
            style={{ ...BTN.base, ...BTN.primary, opacity: loading ? 0.7 : 1 }}
            disabled={loading || !url}
            onClick={runAnalysis}
          >
            {loading ? "⏳ Analizando..." : "🔍 Analizar"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "0.75rem 1rem" }}>
            <p style={{ margin: 0, color: "#991b1b", fontSize: "0.9rem" }}>❌ {error}</p>
          </div>
        )}

        {blueprint && <BlueprintReport blueprint={blueprint} />}
      </div>
    </div>
  );
}

function BlueprintReport({ blueprint: b }: { blueprint: SiteBlueprint }) {
  return (
    <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
      <Section title="Meta">
        <Kv label="Titulo" value={b.meta.title} />
        <Kv label="Descripción" value={b.meta.description} />
        <Kv label="Canonical" value={b.meta.canonical} />
        <Kv label="Idioma" value={b.meta.language} />
        <Kv label="Theme color" value={b.meta.themeColor} />
      </Section>

      <Section title="Stack detectado">
        <Kv label="Framework" value={b.tech.framework} />
        <Kv label="CMS" value={b.tech.cms} />
        <Kv label="Generator" value={b.tech.generator} />
        <Kv label="Server" value={b.tech.hostedBy} />
      </Section>

      <Section title={`Integraciones (${b.integrations.length})`}>
        {b.integrations.length === 0 ? (
          <p style={{ margin: 0, color: "#6b5842", fontSize: "0.88rem" }}>Ninguna detectada</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#4a3d2c", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {b.integrations.map((i) => (
              <li key={i.id}>
                <strong>{i.label}</strong> <span style={{ color: "#8b7355" }}>[{i.category}]</span>
                {i.accountId ? <> · <code>{i.accountId}</code></> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Paleta (${b.palette.length})`}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {b.palette.map((p) => (
            <div
              key={p.hex}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                background: p.hex,
                border: "1px solid #d8cfc5",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                color: "#fff",
                fontSize: "0.72rem",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                paddingBottom: 3,
              }}
              title={`${p.hex} (${p.source}, score ${p.score.toFixed(2)})`}
            >
              {p.hex}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografía">
        {b.typography.length === 0 ? (
          <p style={{ margin: 0, color: "#6b5842", fontSize: "0.88rem" }}>No se detectaron fuentes específicas</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#4a3d2c", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {b.typography.map((t) => (
              <li key={t.family}>
                <strong>{t.family}</strong> <span style={{ color: "#8b7355" }}>[{t.source}]</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Estructura (${b.structure.totalSections} secciones)`}>
        <p style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "#6b5842" }}>
          Hero: {b.structure.hasHero ? "sí" : "no"} · CTA: {b.structure.hasCTA ? "sí" : "no"} · Imgs: {b.structure.totalImages} · Forms: {b.structure.totalForms}
        </p>
        {b.structure.headings.slice(0, 8).map((h, i) => (
          <p key={i} style={{ margin: 0, fontSize: "0.85rem", paddingLeft: (h.level - 1) * 12, color: h.level === 1 ? "#2c2419" : "#4a3d2c" }}>
            <strong>H{h.level}</strong> {h.text}
          </p>
        ))}
      </Section>

      {b.schemaOrg.length > 0 && (
        <Section title={`Schema.org (${b.schemaOrg.length} nodos)`}>
          <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#4a3d2c", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {b.schemaOrg.slice(0, 8).map((n, i) => (
              <li key={i}>
                <code>{Array.isArray(n["@type"]) ? n["@type"].join("/") : n["@type"] || "(sin tipo)"}</code>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <details>
        <summary style={{ cursor: "pointer", color: "#8b7355", fontWeight: 600 }}>Ver JSON completo</summary>
        <pre style={{ marginTop: 8, background: "#1f1f1f", color: "#f5f0ea", padding: 12, borderRadius: 8, fontSize: "0.72rem", overflow: "auto", maxHeight: 360 }}>
{JSON.stringify(b, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#faf7f2", border: "1px solid #e8dfd0", borderRadius: 8, padding: "0.85rem 1rem" }}>
      <h4 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", margin: "0 0 8px", color: "#2c2419" }}>{title}</h4>
      {children}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <p style={{ margin: "2px 0", fontSize: "0.88rem", color: "#4a3d2c", lineHeight: 1.5 }}>
      <span style={{ color: "#8b7355", fontWeight: 600 }}>{label}:</span> {value}
    </p>
  );
}
