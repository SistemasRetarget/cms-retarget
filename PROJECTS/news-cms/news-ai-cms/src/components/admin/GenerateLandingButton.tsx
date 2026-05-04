"use client";

import React, { useState } from "react";

interface FormState {
  topic: string;
  audience: string;
  goal: string;
  tone: string;
  sections: string[];
  primaryColor: string;
}

const TONE_OPTIONS = [
  { value: "profesional", label: "Profesional" },
  { value: "cercano", label: "Cercano / Conversacional" },
  { value: "técnico", label: "Técnico / Especializado" },
  { value: "urgente", label: "Urgente / Persuasivo" }
];

const SECTION_OPTIONS = [
  { value: "hero", label: "Hero (portada principal)" },
  { value: "features", label: "Características / Beneficios" },
  { value: "stats", label: "Estadísticas / Métricas" },
  { value: "testimonials", label: "Testimonios" },
  { value: "cta", label: "Llamada a la acción (CTA)" },
  { value: "faq", label: "Preguntas frecuentes (FAQ)" }
];

const DEFAULT_SECTIONS = ["hero", "features", "stats", "cta", "faq"];

const BTN = {
  base: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "0.65rem 1.4rem", borderRadius: 8, border: "none",
    fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s"
  } as React.CSSProperties,
  primary: { backgroundColor: "#8b7355", color: "#fff" } as React.CSSProperties,
  secondary: { backgroundColor: "#f0ebe4", color: "#4a3d2c" } as React.CSSProperties
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", padding: "0.55rem 0.75rem",
  border: "1px solid #d8cfc5", borderRadius: 6,
  fontSize: "0.9rem", color: "#2c2419", background: "#fff",
  boxSizing: "border-box"
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "0.85rem",
  color: "#4a3d2c", marginBottom: 4
};

export default function GenerateLandingButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean; title?: string; slug?: string;
    sections?: number; editUrl?: string; previewUrl?: string; error?: string;
  } | null>(null);

  const [form, setForm] = useState<FormState>({
    topic: "",
    audience: "",
    goal: "",
    tone: "profesional",
    sections: DEFAULT_SECTIONS,
    primaryColor: "#8b7355"
  });

  function toggleSection(val: string) {
    setForm(f => ({
      ...f,
      sections: f.sections.includes(val)
        ? f.sections.filter(s => s !== val)
        : [...f.sections, val]
    }));
  }

  async function handleGenerate() {
    if (!form.topic || !form.audience || !form.goal) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ background: "#fff", border: "2px solid #8b7355", borderRadius: 12, padding: "1.5rem 1.75rem" }}>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", margin: "0 0 0.5rem", color: "#2c2419" }}>
          🚀 Generar Landing Page con IA
        </h3>
        <p style={{ margin: "0 0 1rem", color: "#6b5842", fontSize: "0.95rem" }}>
          Describe tu producto o servicio y la IA creará una landing page completa lista para editar.
        </p>

        {!open && !result && (
          <button style={{ ...BTN.base, ...BTN.primary }} onClick={() => setOpen(true)}>
            ✨ Crear landing page
          </button>
        )}

        {result?.success && (
          <div style={{ background: "#f0faf4", border: "1px solid #86efac", borderRadius: 8, padding: "1rem 1.25rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "#166534" }}>
              ✅ Landing generada: "{result.title}"
            </p>
            <p style={{ margin: "0 0 0.75rem", color: "#166534", fontSize: "0.9rem" }}>
              {result.sections} secciones creadas
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={result.editUrl} style={{ ...BTN.base, ...BTN.primary, textDecoration: "none" }}>
                ✏️ Editar en admin
              </a>
              <a href={result.previewUrl} target="_blank" rel="noopener" style={{ ...BTN.base, ...BTN.secondary, textDecoration: "none" }}>
                👁️ Ver preview
              </a>
              <button style={{ ...BTN.base, ...BTN.secondary }} onClick={() => { setResult(null); setOpen(true); }}>
                + Crear otra
              </button>
            </div>
          </div>
        )}

        {result?.error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "1rem 1.25rem" }}>
            <p style={{ margin: 0, color: "#991b1b" }}>❌ {result.error}</p>
            <button style={{ ...BTN.base, ...BTN.secondary, marginTop: 8 }} onClick={() => setResult(null)}>
              Reintentar
            </button>
          </div>
        )}

        {open && !result && (
          <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
            <div>
              <label style={LABEL_STYLE}>Producto o servicio *</label>
              <input
                style={INPUT_STYLE}
                placeholder="ej: Software de gestión de inventario para PyMEs"
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>Audiencia objetivo *</label>
              <input
                style={INPUT_STYLE}
                placeholder="ej: Dueños de tiendas y almacenes pequeños"
                value={form.audience}
                onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>Objetivo de conversión *</label>
              <input
                style={INPUT_STYLE}
                placeholder="ej: Conseguir demos gratuitas del software"
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Tono</label>
                <select
                  style={INPUT_STYLE}
                  value={form.tone}
                  onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
                >
                  {TONE_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Color principal</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    style={{ height: 38, width: 50, borderRadius: 6, border: "1px solid #d8cfc5", cursor: "pointer" }}
                  />
                  <input
                    style={{ ...INPUT_STYLE, flex: 1 }}
                    value={form.primaryColor}
                    onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={LABEL_STYLE}>Secciones a incluir</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SECTION_OPTIONS.map(s => (
                  <label key={s.value} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "0.4rem 0.75rem", borderRadius: 6, cursor: "pointer",
                    border: `1px solid ${form.sections.includes(s.value) ? "#8b7355" : "#d8cfc5"}`,
                    background: form.sections.includes(s.value) ? "#f5f0ea" : "#fff",
                    fontSize: "0.85rem", color: "#2c2419"
                  }}>
                    <input
                      type="checkbox"
                      checked={form.sections.includes(s.value)}
                      onChange={() => toggleSection(s.value)}
                      style={{ accentColor: "#8b7355" }}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              <button
                style={{ ...BTN.base, ...BTN.primary, opacity: loading ? 0.7 : 1 }}
                onClick={handleGenerate}
                disabled={loading || !form.topic || !form.audience || !form.goal}
              >
                {loading ? "⏳ Generando..." : "✨ Generar con IA"}
              </button>
              <button style={{ ...BTN.base, ...BTN.secondary }} onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </button>
            </div>

            {loading && (
              <p style={{ margin: 0, color: "#6b5842", fontSize: "0.88rem" }}>
                La IA está creando el contenido de tu landing page. Puede tomar 10-30 segundos...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
