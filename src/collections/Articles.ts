import type { CollectionConfig } from "payload";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "status", "publishedAt", "source"],
    group: "Noticias"
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: "title", type: "text", required: true, localized: true, maxLength: 200 },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL amigable, se autogenera del título" }
    },
    { name: "excerpt", type: "textarea", localized: true, maxLength: 300 },
    { name: "coverImage", type: "upload", relationTo: "media" },
    {
      name: "body",
      type: "richText",
      localized: true,
      admin: { description: "Cuerpo del artículo (generado por IA, editable)" }
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true
    },
    { name: "tags", type: "array", fields: [{ name: "tag", type: "text" }] },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      required: true,
      admin: { position: "sidebar" },
      options: [
        { label: "Borrador", value: "draft" },
        { label: "En revisión", value: "review" },
        { label: "Publicado", value: "published" }
      ]
    },
    { name: "publishedAt", type: "date", admin: { position: "sidebar" } },
    {
      name: "reviewedBy",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", readOnly: true, description: "Editor que revisó" }
    },
    { name: "reviewedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    {
      name: "rejectionReason",
      type: "textarea",
      admin: {
        position: "sidebar",
        description: "Motivo si se devuelve a borrador",
        condition: (data) => data?.status === "draft" && !!data?.reviewedAt
      }
    },
    {
      name: "source",
      type: "relationship",
      relationTo: "sources",
      admin: { position: "sidebar", description: "Fuente original" }
    },
    { name: "sourceUrl", type: "text", admin: { description: "URL original de la noticia" } },
    {
      name: "aiProvider",
      type: "select",
      admin: { readOnly: true, position: "sidebar" },
      options: [
        { label: "Anthropic (Claude)", value: "anthropic" },
        { label: "Gemini", value: "gemini" },
        { label: "OpenAI", value: "openai" },
        { label: "Manual", value: "manual" }
      ]
    },
    { name: "aiModel", type: "text", admin: { readOnly: true, position: "sidebar" } },
    {
      name: "meta",
      type: "group",
      localized: true,
      fields: [
        { name: "title", type: "text", maxLength: 80 },
        { name: "description", type: "textarea", maxLength: 200 }
      ]
    }
  ]
};
