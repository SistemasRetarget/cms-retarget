import type { Field } from "payload";

/**
 * Shared SEO field group — reusable across Articles, LandingPages, etc.
 * Provides full control over meta tags, OG, Twitter, structured data type,
 * canonical URL, and indexing flags.
 *
 * Keep defaults pragmatic: the frontend fills missing values from the site
 * profile, so editors only need to override when they want to.
 */
export const seoFields: Field = {
  name: "meta",
  type: "group",
  label: "SEO",
  localized: true,
  admin: {
    description: "Meta tags, Open Graph, Twitter Cards y datos estructurados.",
  },
  fields: [
    { name: "title", type: "text", maxLength: 120, label: "Meta título" },
    { name: "description", type: "textarea", maxLength: 240, label: "Meta descripción" },
    {
      name: "keywords",
      type: "text",
      label: "Keywords (separadas por coma)",
      admin: { description: "Palabras clave — opcional, menor peso SEO moderno." },
    },
    {
      name: "canonical",
      type: "text",
      label: "Canonical URL (override)",
      admin: { description: "Sólo si quieres apuntar a otra URL como fuente de verdad." },
    },
    {
      name: "ogImage",
      type: "upload",
      relationTo: "media",
      label: "Open Graph image",
      admin: { description: "Imagen para Facebook, LinkedIn, WhatsApp… 1200×630 recomendada." },
    },
    {
      name: "ogType",
      type: "select",
      defaultValue: "article",
      label: "Open Graph type",
      options: [
        { label: "article", value: "article" },
        { label: "website", value: "website" },
        { label: "product", value: "product" },
        { label: "profile", value: "profile" },
      ],
    },
    {
      name: "twitterCard",
      type: "select",
      defaultValue: "summary_large_image",
      label: "Twitter card",
      options: [
        { label: "summary (texto)", value: "summary" },
        { label: "summary_large_image (imagen grande)", value: "summary_large_image" },
      ],
    },
    {
      name: "structuredDataType",
      type: "select",
      defaultValue: "Article",
      label: "Schema.org @type",
      admin: { description: "Tipo JSON-LD a inyectar en la página." },
      options: [
        { label: "NewsArticle (noticia)", value: "NewsArticle" },
        { label: "Article (genérico)", value: "Article" },
        { label: "BlogPosting (blog)", value: "BlogPosting" },
        { label: "WebPage (landing)", value: "WebPage" },
        { label: "Product", value: "Product" },
        { label: "FAQPage", value: "FAQPage" },
      ],
    },
    {
      name: "noindex",
      type: "checkbox",
      label: "No indexar (robots: noindex)",
      defaultValue: false,
    },
    {
      name: "nofollow",
      type: "checkbox",
      label: "No seguir enlaces (robots: nofollow)",
      defaultValue: false,
    },
  ],
};
