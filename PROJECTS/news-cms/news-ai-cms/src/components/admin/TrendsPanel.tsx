"use client";
import React, { useCallback, useEffect, useState } from "react";

type Trend = {
  title: string;
  summary: string;
  categories: string[];
  articleIds: Array<string | number>;
  score: number;
};

type TrendsResponse = {
  window: "24h" | "48h";
  analyzedAt: string;
  articlesAnalyzed: number;
  trends: Trend[];
  provider: string;
  model: string;
  fromCache?: boolean;
  error?: string;
};

function scoreColor(score: number): string {
  if (score >= 0.85) return "#c0392b";
  if (score >= 0.7) return "#e67e22";
  if (score >= 0.55) return "#8b7355";
  return "#a88c6b";
}

function scoreLabel(score: number): string {
  if (score >= 0.85) return "🔥 muy caliente";
  if (score >= 0.7) return "⚡ relevante";
  if (score >= 0.55) return "📈 creciendo";
  return "· marginal";
}

export default function TrendsPanel() {
  const [window, setWindow] = useState<"24h" | "48h">("24h");
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (w: "24h" | "48h", refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const qs = `?window=${w}${refresh ? "&refresh=1" : ""}`;
      const r = await fetch(`/api/trends${qs}`, { credentials: "include" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(window); }, [window, load]);

  return (
    <div style={{ background: "#fff", border: "1px solid #e8dfd0", borderRadius: 12, padding: "1.5rem 1.75rem", marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", margin: "0 0 0.3rem", color: "#2c2419" }}>
            📊 Tendencias
          </h3>
          <p style={{ margin: 0, color: "#6b5842", fontSize: "0.88rem" }}>
            Temas recurrentes detectados por IA entre noticias publicadas.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", border: "1px solid #d4c4a8", borderRadius: 6, overflow: "hidden" }}>
            <button
              onClick={() => setWindow("24h")}
              style={{
                background: window === "24h" ? "#8b7355" : "#fff",
                color: window === "24h" ? "#fff" : "#2c2419",
                border: "none", padding: "0.45rem 0.9rem", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem"
              }}
            >24h</button>
            <button
              onClick={() => setWindow("48h")}
              style={{
                background: window === "48h" ? "#8b7355" : "#fff",
                color: window === "48h" ? "#fff" : "#2c2419",
                border: "none", borderLeft: "1px solid #d4c4a8", padding: "0.45rem 0.9rem", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem"
              }}
            >48h</button>
          </div>
          <button
            onClick={() => load(window, true)}
            disabled={loading}
            title="Forzar re-análisis (ignora cache)"
            style={{
              background: "#fff", color: "#8b7355", border: "1px solid #d4c4a8",
              padding: "0.45rem 0.7rem", borderRadius: 6, cursor: loading ? "wait" : "pointer", fontSize: "0.85rem"
            }}
          >
            {loading ? "…" : "↻"}
          </button>
        </div>
      </div>

      {loading && !data && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#8b7355" }}>
          Analizando noticias con IA…
        </div>
      )}

      {error && (
        <div style={{ padding: "0.8rem 1rem", background: "#fde8e8", border: "1px solid #c0392b", borderRadius: 6, color: "#8b1f15", fontSize: "0.9rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && !error && data.articlesAnalyzed === 0 && (
        <div style={{ padding: "1.5rem", textAlign: "center", background: "#faf8f4", borderRadius: 8, color: "#8b7355", fontSize: "0.92rem" }}>
          No hay noticias publicadas en las últimas {window === "24h" ? "24" : "48"} horas. Aprueba algunas desde la cola.
        </div>
      )}

      {data && !error && data.articlesAnalyzed > 0 && data.trends.length === 0 && (
        <div style={{ padding: "1.5rem", textAlign: "center", background: "#faf8f4", borderRadius: 8, color: "#8b7355", fontSize: "0.92rem" }}>
          Se analizaron {data.articlesAnalyzed} noticias pero no se detectaron tendencias claras.
        </div>
      )}

      {data && data.trends.length > 0 && (
        <div style={{ display: "grid", gap: "0.8rem" }}>
          {data.trends.map((t, i) => (
            <div key={i} style={{
              border: "1px solid #e8dfd0",
              borderLeft: `4px solid ${scoreColor(t.score)}`,
              borderRadius: 8,
              padding: "0.9rem 1.1rem",
              background: "#fafaf7"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <h4 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "1.05rem", color: "#2c2419", flex: "1 1 auto" }}>
                  {t.title}
                </h4>
                <span style={{ fontSize: "0.78rem", color: scoreColor(t.score), fontWeight: 700, whiteSpace: "nowrap" }}>
                  {scoreLabel(t.score)} · {Math.round(t.score * 100)}%
                </span>
              </div>
              <p style={{ margin: "0 0 0.6rem", color: "#4a3d2c", fontSize: "0.88rem", lineHeight: 1.5 }}>
                {t.summary}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", fontSize: "0.78rem" }}>
                <span style={{ color: "#8b7355" }}>
                  {t.articleIds.length} noticia{t.articleIds.length !== 1 ? "s" : ""}
                </span>
                {t.categories.map((c) => (
                  <span key={c} style={{ background: "#f0ebe0", color: "#6b5842", padding: "1px 7px", borderRadius: 10, fontSize: "0.72rem" }}>
                    {c}
                  </span>
                ))}
                <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  {t.articleIds.slice(0, 5).map((id) => (
                    <a
                      key={String(id)}
                      href={`/admin/collections/articles/${id}`}
                      style={{ color: "#8b7355", textDecoration: "none", background: "#fff", border: "1px solid #d4c4a8", padding: "1px 7px", borderRadius: 4, fontSize: "0.72rem" }}
                    >
                      #{String(id)}
                    </a>
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div style={{ marginTop: "0.8rem", fontSize: "0.72rem", color: "#a88c6b", textAlign: "right" }}>
          {data.articlesAnalyzed} noticias analizadas · {data.provider}/{data.model}
          {data.fromCache && " · desde cache (↻ para refrescar)"}
        </div>
      )}
    </div>
  );
}
