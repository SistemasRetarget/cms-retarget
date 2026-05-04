"use client";
import React, { useCallback, useEffect, useState } from "react";

type Category = { id: string | number; slug: string; name: string; color?: string };
type QueueArticle = {
  id: string | number;
  title: string;
  excerpt?: string;
  slug: string;
  createdAt: string;
  sourceUrl?: string;
  category: Category | null;
  source: { id: string | number; name: string } | null;
  aiProvider?: string;
};
type QueueResponse = {
  total: number;
  counts: Record<string, number>;
  categories: Category[];
  articles: QueueArticle[];
};

const ALL = "__all__";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export default function ApprovalQueue() {
  const [activeTab, setActiveTab] = useState<string>(ALL);
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [rejectingId, setRejectingId] = useState<string | number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async (tab: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = tab !== ALL ? `?category=${encodeURIComponent(tab)}` : "";
      const r = await fetch(`/api/articles/queue${qs}`, { credentials: "include" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  async function approve(id: string | number) {
    setBusyId(id);
    try {
      const r = await fetch("/api/articles/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      await load(activeTab);
    } catch (e) {
      alert(`Error al aprobar: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(id: string | number) {
    setBusyId(id);
    try {
      const r = await fetch("/api/articles/reject", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reason: rejectReason })
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setRejectingId(null);
      setRejectReason("");
      await load(activeTab);
    } catch (e) {
      alert(`Error al rechazar: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  const articles = data?.articles || [];
  const cats = data?.categories || [];
  const total = data?.total || 0;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", margin: "0 0 0.3rem", color: "#2c2419" }}>
          Cola de aprobación
        </h2>
        <p style={{ margin: 0, color: "#6b5842", fontSize: "0.95rem" }}>
          Artículos en revisión, agrupados por ámbito. Aprobar publica en el frontend; rechazar devuelve a borrador.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.5rem", borderBottom: "1px solid #e8dfd0", paddingBottom: 12 }}>
        <TabButton
          label="Todas"
          count={total}
          active={activeTab === ALL}
          onClick={() => setActiveTab(ALL)}
          color="#2c2419"
        />
        {cats.map((c) => {
          const n = data?.counts[c.slug] || 0;
          return (
            <TabButton
              key={c.slug}
              label={c.name}
              count={n}
              active={activeTab === c.slug}
              onClick={() => setActiveTab(c.slug)}
              color={c.color || "#8b7355"}
            />
          );
        })}
      </div>

      {loading && <div style={{ padding: "2rem", textAlign: "center", color: "#6b5842" }}>Cargando…</div>}

      {error && (
        <div style={{ padding: "1rem", background: "#fde8e8", border: "1px solid #c0392b", borderRadius: 6, color: "#8b1f15", marginBottom: "1rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div style={{ padding: "3rem", textAlign: "center", background: "#faf8f4", borderRadius: 12, color: "#8b7355" }}>
          <p style={{ fontSize: "1.1rem", margin: 0 }}>No hay artículos en revisión para este ámbito.</p>
          <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0" }}>
            Los artículos generados por IA aparecen aquí cuando pasan a estado <strong>En revisión</strong>.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {articles.map((a) => (
          <article
            key={a.id}
            style={{
              background: "#fff",
              border: "1px solid #e8dfd0",
              borderLeft: `4px solid ${a.category?.color || "#8b7355"}`,
              borderRadius: 10,
              padding: "1.1rem 1.3rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 60%", minWidth: 280 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                  {a.category && (
                    <span style={{
                      background: a.category.color || "#8b7355",
                      color: "#fff",
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}>
                      {a.category.name}
                    </span>
                  )}
                  {a.source && (
                    <span style={{ fontSize: "0.8rem", color: "#8b7355" }}>
                      📰 {a.source.name}
                    </span>
                  )}
                  {a.aiProvider && (
                    <span style={{ fontSize: "0.72rem", color: "#6b5842", background: "#f0ebe0", padding: "2px 6px", borderRadius: 4 }}>
                      {a.aiProvider}
                    </span>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "#a88c6b" }}>
                    {formatDate(a.createdAt)}
                  </span>
                </div>
                <h3 style={{ margin: "0 0 0.4rem", fontFamily: "Georgia, serif", fontSize: "1.15rem", color: "#2c2419", lineHeight: 1.35 }}>
                  {a.title}
                </h3>
                {a.excerpt && (
                  <p style={{ margin: 0, color: "#4a3d2c", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    {a.excerpt}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
                <button
                  disabled={busyId === a.id}
                  onClick={() => approve(a.id)}
                  style={{
                    background: "#4a7c3a",
                    color: "#fff",
                    border: "none",
                    padding: "0.55rem 1rem",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: busyId === a.id ? "wait" : "pointer",
                    fontSize: "0.88rem"
                  }}
                >
                  {busyId === a.id ? "…" : "✓ Aprobar y publicar"}
                </button>
                <button
                  disabled={busyId === a.id}
                  onClick={() => { setRejectingId(a.id); setRejectReason(""); }}
                  style={{
                    background: "#fff",
                    color: "#c0392b",
                    border: "1px solid #c0392b",
                    padding: "0.5rem 1rem",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.88rem"
                  }}
                >
                  ↩ Rechazar
                </button>
                <a
                  href={`/admin/collections/articles/${a.id}`}
                  style={{
                    textAlign: "center",
                    background: "#fff",
                    color: "#8b7355",
                    border: "1px solid #d4c4a8",
                    padding: "0.5rem 1rem",
                    borderRadius: 6,
                    fontSize: "0.85rem",
                    textDecoration: "none"
                  }}
                >
                  ✎ Editar
                </a>
                {a.sourceUrl && (
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.78rem", color: "#8b7355", textAlign: "center" }}
                  >
                    Ver fuente original ↗
                  </a>
                )}
              </div>
            </div>

            {rejectingId === a.id && (
              <div style={{ marginTop: "0.9rem", padding: "0.9rem", background: "#fdf7f6", border: "1px solid #f0c8c0", borderRadius: 6 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "#8b1f15" }}>
                  Motivo del rechazo (opcional, queda guardado):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="Ej: titular confuso, fuente no confiable, duplicado, etc."
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #d4c4a8",
                    borderRadius: 4,
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    resize: "vertical"
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    disabled={busyId === a.id}
                    onClick={() => confirmReject(a.id)}
                    style={{ background: "#c0392b", color: "#fff", border: "none", padding: "0.45rem 0.9rem", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                  >
                    Confirmar rechazo
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason(""); }}
                    style={{ background: "#fff", color: "#6b5842", border: "1px solid #d4c4a8", padding: "0.45rem 0.9rem", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function TabButton({ label, count, active, onClick, color }: {
  label: string; count: number; active: boolean; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? color : "#fff",
        color: active ? "#fff" : "#2c2419",
        border: `1px solid ${active ? color : "#e8dfd0"}`,
        padding: "0.5rem 0.95rem",
        borderRadius: 20,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.88rem",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s"
      }}
    >
      {label}
      <span style={{
        background: active ? "rgba(255,255,255,0.25)" : "#f0ebe0",
        color: active ? "#fff" : "#6b5842",
        fontSize: "0.75rem",
        padding: "1px 7px",
        borderRadius: 10,
        fontWeight: 700,
        minWidth: 20,
        textAlign: "center"
      }}>
        {count}
      </span>
    </button>
  );
}
