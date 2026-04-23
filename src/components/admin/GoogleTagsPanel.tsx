"use client";

import React, { useState, useEffect } from "react";

interface VerifyResult {
  ok: boolean;
  message: string;
}

interface VerifyResponse {
  gtm?: VerifyResult;
  ga4?: VerifyResult;
  error?: string;
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.8rem",
  border: "1px solid #d8cfc5", borderRadius: 6,
  fontSize: "0.95rem", color: "#2c2419", background: "#fff",
  fontFamily: "monospace", boxSizing: "border-box"
};

const LABEL: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "0.85rem",
  color: "#4a3d2c", marginBottom: 4
};

const BTN_BASE: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "0.6rem 1.2rem", borderRadius: 8, border: "none",
  fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
};

function StatusBadge({ result }: { result?: VerifyResult }) {
  if (!result) return null;
  const bg = result.ok ? "#f0faf4" : "#fef2f2";
  const border = result.ok ? "#86efac" : "#fca5a5";
  const color = result.ok ? "#166534" : "#991b1b";
  const icon = result.ok ? "✅" : "❌";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: "0.5rem 0.75rem", marginTop: 6, fontSize: "0.85rem", color }}>
      {icon} {result.message}
    </div>
  );
}

export default function GoogleTagsPanel() {
  const [gtmId, setGtmId] = useState("");
  const [ga4Id, setGa4Id] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Cargar configuración actual
  useEffect(() => {
    fetch("/api/google-settings-read")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setGtmId(data.gtmId || "");
          setGa4Id(data.ga4Id || "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleVerify() {
    if (!gtmId && !ga4Id) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/google/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gtmId: gtmId || undefined, ga4Id: ga4Id || undefined })
      });
      setVerifyResult(await res.json());
    } catch (e) {
      setVerifyResult({ error: (e as Error).message });
    } finally {
      setVerifying(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/globals/google-settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gtmId, ga4Id, enabled: !!(gtmId || ga4Id) })
      });
      if (res.ok) {
        setSaveMsg({ ok: true, text: "Configuración guardada. Los scripts se activarán en el sitio público." });
      } else {
        const d = await res.json();
        setSaveMsg({ ok: false, text: d?.errors?.[0]?.message || "Error al guardar" });
      }
    } catch (e) {
      setSaveMsg({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const gtmValid = /^GTM-[A-Z0-9]{4,}$/i.test(gtmId);
  const ga4Valid = /^G-[A-Z0-9]{8,}$/i.test(ga4Id);
  const canVerify = (gtmId.trim() !== "" || ga4Id.trim() !== "");

  return (
    <div style={{ background: "#fff", border: "2px solid #4285F4", borderRadius: 12, padding: "1.5rem 1.75rem", marginTop: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.4rem" }}>
        <span style={{ fontSize: "1.4rem" }}>📊</span>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", margin: 0, color: "#2c2419" }}>
          Google Analytics & Tag Manager
        </h3>
      </div>
      <p style={{ margin: "0 0 1.25rem", color: "#6b5842", fontSize: "0.9rem" }}>
        Los scripts se cargan de forma asíncrona — sin impacto en Lighthouse ni Core Web Vitals.
        Configura aquí y verifica antes de activar.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {/* GTM */}
        <div>
          <label style={LABEL}>
            Google Tag Manager ID
            {gtmId && (
              <span style={{ marginLeft: 6, fontWeight: 400, color: gtmValid ? "#166534" : "#991b1b" }}>
                {gtmValid ? "✓ formato válido" : "⚠ formato inválido"}
              </span>
            )}
          </label>
          <input
            style={INPUT}
            placeholder="GTM-XXXXXXX"
            value={gtmId}
            onChange={e => { setGtmId(e.target.value.toUpperCase()); setVerifyResult(null); }}
            spellCheck={false}
          />
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9e8872" }}>
            Recomendado. Gestiona GA4 y otros tags desde el contenedor GTM.
          </p>
          {verifyResult?.gtm && <StatusBadge result={verifyResult.gtm} />}
        </div>

        {/* GA4 */}
        <div>
          <label style={LABEL}>
            GA4 Measurement ID
            {ga4Id && (
              <span style={{ marginLeft: 6, fontWeight: 400, color: ga4Valid ? "#166534" : "#991b1b" }}>
                {ga4Valid ? "✓ formato válido" : "⚠ formato inválido"}
              </span>
            )}
          </label>
          <input
            style={INPUT}
            placeholder="G-XXXXXXXXXX"
            value={ga4Id}
            onChange={e => { setGa4Id(e.target.value.toUpperCase()); setVerifyResult(null); }}
            spellCheck={false}
          />
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9e8872" }}>
            Solo si <strong>no usas GTM</strong>. Si tienes GTM, configura GA4 desde allí.
          </p>
          {verifyResult?.ga4 && <StatusBadge result={verifyResult.ga4} />}
        </div>

        {verifyResult?.error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "#991b1b" }}>
            ❌ {verifyResult.error}
          </div>
        )}

        {saveMsg && (
          <div style={{
            background: saveMsg.ok ? "#f0faf4" : "#fef2f2",
            border: `1px solid ${saveMsg.ok ? "#86efac" : "#fca5a5"}`,
            borderRadius: 6, padding: "0.5rem 0.75rem",
            fontSize: "0.85rem", color: saveMsg.ok ? "#166534" : "#991b1b"
          }}>
            {saveMsg.ok ? "✅" : "❌"} {saveMsg.text}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
          <button
            style={{ ...BTN_BASE, backgroundColor: "#4285F4", color: "#fff", opacity: verifying || !canVerify ? 0.6 : 1 }}
            onClick={handleVerify}
            disabled={verifying || !canVerify}
          >
            {verifying ? "⏳ Verificando..." : "🔍 Verificar tags"}
          </button>
          <button
            style={{ ...BTN_BASE, backgroundColor: "#8b7355", color: "#fff", opacity: saving ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "💾 Guardar configuración"}
          </button>
          <a
            href="/admin/globals/google-settings"
            style={{ ...BTN_BASE, backgroundColor: "#f0ebe4", color: "#4a3d2c", textDecoration: "none" }}
          >
            ⚙️ Ver todas las opciones
          </a>
        </div>
      </div>

      <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f8f9ff", borderRadius: 8, fontSize: "0.82rem", color: "#4a5568", lineHeight: 1.7 }}>
        <strong>💡 Cómo funciona:</strong> Los scripts usan <code>strategy="afterInteractive"</code> de Next.js —
        se cargan solo después de que la página es interactiva, sin bloquear el render ni afectar
        Largest Contentful Paint ni First Input Delay.
      </div>
    </div>
  );
}
