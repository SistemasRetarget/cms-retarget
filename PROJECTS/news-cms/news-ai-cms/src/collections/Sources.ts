import type { CollectionConfig } from "payload";

export const Sources: CollectionConfig = {
  slug: "sources",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "active", "lastFetchedAt", "url"],
    group: "Noticias",
    description: "Fuentes de contenido: sitios web, RSS, YouTube, Instagram, TikTok, Twitter/X y Facebook."
  },
  access: { read: () => true },
  fields: [
    { name: "name", type: "text", required: true, label: "Nombre de la fuente" },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "rss",
      label: "Tipo de fuente",
      options: [
        { label: "🔗 RSS / Atom feed", value: "rss" },
        { label: "🌐 Sitio web (artículo HTML)", value: "html" },
        { label: "🗺️ Sitemap.xml", value: "sitemap" },
        { label: "🎬 YouTube — Canal", value: "youtube_channel" },
        { label: "▶️  YouTube — Video / Short", value: "youtube_video" },
        { label: "📸 Instagram — Reel / Post", value: "instagram" },
        { label: "🎵 TikTok — Video", value: "tiktok" },
        { label: "🐦 Twitter / X — Tweet", value: "twitter" },
        { label: "👥 Facebook — Post / Página", value: "facebook" },
        { label: "🔍 Auto-detectar desde URL", value: "url_auto" }
      ],
      admin: {
        description: "Selecciona el tipo o usa Auto-detectar para que el sistema lo identifique por la URL."
      }
    },
    {
      name: "url",
      type: "text",
      required: true,
      label: "URL",
      admin: {
        description: "Pega cualquier URL: feed RSS, artículo web, canal de YouTube (@handle o /channel/ID), reel de Instagram, video de TikTok, tweet, etc."
      }
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      label: "Categorías",
      admin: { description: "Categorías para los artículos generados de esta fuente" }
    },
    {
      name: "language",
      type: "select",
      defaultValue: "es",
      label: "Idioma del contenido",
      options: [
        { label: "Español", value: "es" },
        { label: "English", value: "en" },
        { label: "Portugués", value: "pt" }
      ]
    },
    {
      name: "prompt",
      type: "textarea",
      label: "Prompt personalizado (opcional)",
      admin: {
        description: "Instrucciones específicas para la IA al procesar esta fuente. Si está vacío, usa el prompt global de AI Settings."
      }
    },
    {
      name: "maxArticlesPerFetch",
      type: "number",
      defaultValue: 5,
      min: 1,
      max: 50,
      label: "Máximo de artículos por fetch",
      admin: {
        description: "Para feeds y canales. Para URLs individuales (video, reel, tweet) se ignora."
      }
    },
    { name: "active", type: "checkbox", defaultValue: true, label: "Activa" },
    {
      type: "collapsible",
      label: "🔑 Credenciales opcionales (Instagram / Facebook)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "metaToken",
          type: "text",
          label: "Meta App Token",
          admin: {
            description: "Requerido para obtener el contenido completo de Instagram y Facebook. Obtén el token en developers.facebook.com.",
            placeholder: "EAAxxxxxxx..."
          }
        }
      ]
    },
    {
      name: "lastFetchedAt",
      type: "date",
      label: "Último fetch",
      admin: { readOnly: true, position: "sidebar" }
    },
    {
      name: "lastFetchStatus",
      type: "select",
      label: "Estado",
      admin: { readOnly: true, position: "sidebar" },
      options: [
        { label: "✅ Ok", value: "ok" },
        { label: "❌ Error", value: "error" },
        { label: "⏳ Pendiente", value: "pending" }
      ]
    },
    {
      name: "lastFetchError",
      type: "textarea",
      label: "Último error",
      admin: { readOnly: true, position: "sidebar" }
    }
  ]
};
