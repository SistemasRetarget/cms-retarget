"use client";
import React, { useState } from "react";

type Report = { provider: string; model: string; sources: number; articlesCreated: number; report: Array<{ source: string; ok: number; errors: string[] }> };

export default function FetchNewsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchNow() {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/news/fetch", { method: "POST", credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={fetchNow} disabled={loading}
        style={{
          background: loading ? "#a88c6b" : "#8b7355",
          color: "#fff", border: "none", padding: "0.8rem 1.6rem", borderRadius: 8,
          fontWeight: 600, fontSize: "1rem", cursor: loading ? "wait" : "pointer",
          boxShadow: "0 4px 12px -2px rgba(139,115,85,0.4)",
          textTransform: "uppercase", letterSpacing: "0.05em"
        }}>
        {loading ? "Procesando…" : "⚡ Fetch ahora"}
      </button>

      {error && (
        <div style={{ marginTop: "1rem", padding: "0.8rem 1rem", background: "#fde8e8", border: "1px solid #c0392b", borderRadius: 6, color: "#8b1f15" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "1rem", padding: "1rem 1.2rem", background: "#e6f0df", border: "1px solid #4a7c3a", borderRadius: 6 }}>
          <p style={{ margin: "0 0 0.5rem" }}>
            <strong>{result.articlesCreated}</strong> artículos creados vía <code>{result.provider}</code> ({result.model})
            · {result.sources} fuentes procesadas
          </p>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
            {result.report.map((r, i) => (
              <li key={i}>
                <strong>{r.source}</strong>: {r.ok} OK
                {r.errors.length > 0 && <span style={{ color: "#c0392b" }}> · {r.errors.length} errores</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
