import React from "react";
import { Gutter } from "@payloadcms/ui";
import type { AdminViewServerProps } from "payload";
import FetchNewsButton from "./FetchNewsButton";
import GenerateLandingButton from "./GenerateLandingButton";
import GoogleTagsPanel from "./GoogleTagsPanel";
import TrendsPanel from "./TrendsPanel";
import SiteAnalyzerPanel from "./SiteAnalyzerPanel";
import { getActiveProfile } from "@/site-profiles";

interface Shortcut {
  href: string;
  title: string;
  desc: string;
  icon: string;
  /** If set, shortcut only shows when this feature is enabled on the active profile. */
  requires?: keyof ReturnType<typeof getActiveProfile>["features"];
}

const ALL_SHORTCUTS: Shortcut[] = [
  { href: "/admin/cola-aprobacion", title: "Cola de aprobación", desc: "Revisar y publicar artículos por ámbito", icon: "\u{2705}", requires: "news" },
  { href: "/admin/collections/articles", title: "Artículos", desc: "Noticias publicadas, borradores y en revisión", icon: "\u{1F4F0}" },
  { href: "/admin/collections/sources", title: "Fuentes", desc: "RSS, sitios y sitemaps para recolectar", icon: "\u{1F517}", requires: "news" },
  { href: "/admin/collections/categories", title: "Categorías", desc: "Organización temática del contenido", icon: "\u{1F3F7}" },
  { href: "/admin/globals/ai-settings", title: "AI Settings", desc: "Credenciales Anthropic / Gemini / OpenAI", icon: "\u{1F916}", requires: "ai" },
  { href: "/admin/collections/landing-pages", title: "Landings", desc: "Landing pages generadas con IA", icon: "\u{1F680}", requires: "landingPages" },
  { href: "/admin/collections/media", title: "Medios", desc: "Imágenes y archivos", icon: "\u{1F5BC}" },
  { href: "/", title: "Ver sitio público", desc: "Sitio público", icon: "\u{1F310}" },
];

const Dashboard: React.FC<AdminViewServerProps> = ({ initPageResult }) => {
  const user = initPageResult.req.user as { name?: string; email?: string } | null;
  const userName = user?.name || user?.email || "editor";
  const profile = getActiveProfile();
  const { features, branding } = profile;

  const shortcuts = ALL_SHORTCUTS.filter((s) => !s.requires || features[s.requires]);

  return (
    <Gutter>
      <div className="pld-welcome">
        <h2>Hola, {userName}</h2>
        <p>
          Panel de administración de <strong>{branding.siteName}</strong>. Perfil activo: <code>{profile.id}</code>.
        </p>
      </div>

      {features.news && features.ai && (
        <div style={{ background: "#fff", border: "2px solid #8b7355", borderRadius: 12, padding: "1.5rem 1.75rem", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", margin: "0 0 0.5rem", color: "#2c2419" }}>
            Recolectar noticias ahora
          </h3>
          <p style={{ margin: "0 0 1rem", color: "#6b5842", fontSize: "0.95rem" }}>
            Procesa todas las fuentes activas: descarga los items más recientes, los pasa por IA y crea artículos.
          </p>
          <FetchNewsButton />
        </div>
      )}

      {features.trends && <TrendsPanel />}
      {features.landingPages && features.ai && <GenerateLandingButton />}
      {features.analyzer && <SiteAnalyzerPanel />}
      {features.googleTags && <GoogleTagsPanel />}

      <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", marginBottom: "1rem", marginTop: "2rem", color: "#2c2419" }}>
        Accesos rápidos
      </h3>

      <div className="pld-shortcuts">
        {shortcuts.map((s) => (
          <a key={s.href} href={s.href} className="pld-shortcut" target={s.href.startsWith("/admin") ? "_self" : "_blank"} rel="noopener">
            <span className="pld-shortcut__icon" aria-hidden="true">{s.icon}</span>
            <div className="pld-shortcut__title">{s.title}</div>
            <p className="pld-shortcut__desc">{s.desc}</p>
          </a>
        ))}
      </div>

      {features.news && (
        <div style={{ background: "#fff", border: "1px solid #e8dfd0", borderRadius: 12, padding: "1.5rem 1.75rem", marginTop: "1rem" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", margin: "0 0 0.75rem", color: "#2c2419" }}>
            Flujo de trabajo
          </h3>
          <ol style={{ margin: 0, paddingLeft: "1.3rem", lineHeight: 1.8, color: "#4a3d2c" }}>
            {features.ai && <li>Abre <strong>AI Settings</strong> y pega tu API key (Anthropic, Gemini u OpenAI).</li>}
            <li>Crea <strong>Categorías</strong> (ej. Tecnología, Política, Negocios).</li>
            <li>Agrega <strong>Fuentes</strong> RSS activas y asígnales categorías.</li>
            <li>Haz click en <strong>Fetch ahora</strong> arriba o configura el cron.</li>
            <li>Revisa los artículos en <strong>Artículos</strong> y publica cuando quieras.</li>
          </ol>
        </div>
      )}
    </Gutter>
  );
};

export default Dashboard;
