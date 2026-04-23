import type { CollectionConfig } from "payload";

const HeroBlock = {
  slug: "hero",
  labels: { singular: "Hero", plural: "Heroes" },
  fields: [
    { name: "headline", type: "text" as const, required: true },
    { name: "subheadline", type: "textarea" as const },
    { name: "ctaText", type: "text" as const, label: "Texto del botón CTA" },
    { name: "ctaUrl", type: "text" as const, label: "URL del botón CTA" },
    {
      name: "backgroundType",
      type: "select" as const,
      defaultValue: "gradient",
      options: [
        { label: "Color sólido", value: "solid" },
        { label: "Gradiente", value: "gradient" },
        { label: "Oscuro", value: "dark" }
      ]
    },
    { name: "backgroundColor", type: "text" as const, label: "Color de fondo (hex)", defaultValue: "#f8f7f4" }
  ]
};

const FeaturesBlock = {
  slug: "features",
  labels: { singular: "Características", plural: "Características" },
  fields: [
    { name: "title", type: "text" as const, required: true },
    { name: "subtitle", type: "textarea" as const },
    {
      name: "items",
      type: "array" as const,
      label: "Características",
      fields: [
        { name: "icon", type: "text" as const, label: "Emoji o icono" },
        { name: "title", type: "text" as const, required: true },
        { name: "description", type: "textarea" as const }
      ]
    }
  ]
};

const CTABlock = {
  slug: "cta",
  labels: { singular: "Call to Action", plural: "CTAs" },
  fields: [
    { name: "headline", type: "text" as const, required: true },
    { name: "description", type: "textarea" as const },
    { name: "buttonText", type: "text" as const, label: "Texto del botón" },
    { name: "buttonUrl", type: "text" as const, label: "URL del botón" },
    {
      name: "variant",
      type: "select" as const,
      defaultValue: "dark",
      options: [
        { label: "Oscuro", value: "dark" },
        { label: "Claro", value: "light" },
        { label: "Acento", value: "accent" }
      ]
    }
  ]
};

const TestimonialsBlock = {
  slug: "testimonials",
  labels: { singular: "Testimonios", plural: "Testimonios" },
  fields: [
    { name: "title", type: "text" as const },
    {
      name: "items",
      type: "array" as const,
      label: "Testimonios",
      fields: [
        { name: "name", type: "text" as const, required: true },
        { name: "role", type: "text" as const },
        { name: "company", type: "text" as const },
        { name: "text", type: "textarea" as const, required: true },
        {
          name: "rating",
          type: "number" as const,
          min: 1,
          max: 5,
          defaultValue: 5
        }
      ]
    }
  ]
};

const FAQBlock = {
  slug: "faq",
  labels: { singular: "FAQ", plural: "FAQs" },
  fields: [
    { name: "title", type: "text" as const, defaultValue: "Preguntas frecuentes" },
    {
      name: "items",
      type: "array" as const,
      label: "Preguntas",
      fields: [
        { name: "question", type: "text" as const, required: true },
        { name: "answer", type: "textarea" as const, required: true }
      ]
    }
  ]
};

const StatsBlock = {
  slug: "stats",
  labels: { singular: "Estadísticas", plural: "Estadísticas" },
  fields: [
    { name: "title", type: "text" as const },
    {
      name: "items",
      type: "array" as const,
      label: "Métricas",
      fields: [
        { name: "value", type: "text" as const, required: true, label: "Valor (ej: +500)" },
        { name: "label", type: "text" as const, required: true, label: "Etiqueta" }
      ]
    }
  ]
};

export const LandingPages: CollectionConfig = {
  slug: "landing-pages",
  labels: { singular: "Landing Page", plural: "Landing Pages" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
    group: "Contenido"
  },
  access: {
    read: () => true
  },
  versions: { drafts: true },
  fields: [
    { name: "title", type: "text", required: true, label: "Título interno" },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL: /landing/[slug]" }
    },
    {
      name: "sections",
      type: "blocks",
      label: "Secciones",
      blocks: [HeroBlock, FeaturesBlock, CTABlock, TestimonialsBlock, FAQBlock, StatsBlock]
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Borrador", value: "draft" },
        { label: "Publicada", value: "published" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "primaryColor",
      type: "text",
      defaultValue: "#8b7355",
      label: "Color principal (hex)",
      admin: { position: "sidebar", description: "Color de botones y acentos" }
    },
    {
      name: "aiGenerated",
      type: "checkbox",
      defaultValue: false,
      label: "Generada con IA",
      admin: { position: "sidebar" }
    },
    {
      name: "meta",
      type: "group",
      label: "SEO",
      fields: [
        { name: "title", type: "text", label: "Meta título" },
        { name: "description", type: "textarea", label: "Meta descripción" }
      ]
    }
  ]
};
