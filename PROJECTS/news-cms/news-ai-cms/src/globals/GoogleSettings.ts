import type { GlobalConfig } from "payload";

export const GoogleSettings: GlobalConfig = {
  slug: "google-settings",
  label: "Google Analytics & Tag Manager",
  admin: {
    group: "Configuración",
    description: "Configura Google Tag Manager y Google Analytics 4. Los scripts se cargan de forma asíncrona sin afectar el rendimiento."
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => (req.user as { role?: string } | null)?.role === "admin"
  },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      defaultValue: false,
      label: "Activar scripts de Google",
      admin: { description: "Habilita o deshabilita la carga de GTM y GA4 en el sitio público" }
    },
    {
      type: "collapsible",
      label: "Google Tag Manager (recomendado)",
      admin: { initCollapsed: false },
      fields: [
        {
          name: "gtmId",
          type: "text",
          label: "GTM Container ID",
          admin: {
            placeholder: "GTM-XXXXXXX",
            description: "Formato: GTM-XXXXXXX · Encuentra el ID en tagmanager.google.com → Tu contenedor → ID"
          }
        }
      ]
    },
    {
      type: "collapsible",
      label: "Google Analytics 4 (solo si no usas GTM)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "ga4Id",
          type: "text",
          label: "GA4 Measurement ID",
          admin: {
            placeholder: "G-XXXXXXXXXX",
            description: "Formato: G-XXXXXXXXXX · Encuéntralo en analytics.google.com → Admin → Flujos de datos. Si usas GTM, configura GA4 desde allí y deja esto vacío."
          }
        }
      ]
    },
    {
      name: "anonymizeIp",
      type: "checkbox",
      defaultValue: true,
      label: "Anonimizar IP",
      admin: { description: "Recomendado para cumplir con GDPR / ley de datos personales" }
    },
    {
      name: "cookieConsent",
      type: "checkbox",
      defaultValue: false,
      label: "Requerir consentimiento de cookies",
      admin: { description: "Si está activo, los scripts solo se cargan después de que el usuario acepta cookies" }
    }
  ]
};
