import type { GlobalConfig } from "payload";

export const AISettings: GlobalConfig = {
  slug: "ai-settings",
  admin: {
    group: "Configuración",
    description: "Credenciales y preferencias para proveedores de IA. Solo visibles para administradores."
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => (req.user as { role?: string } | null)?.role === "admin"
  },
  fields: [
    {
      name: "activeProvider",
      type: "select",
      required: true,
      defaultValue: "anthropic",
      options: [
        { label: "Anthropic (Claude)", value: "anthropic" },
        { label: "Google Gemini", value: "gemini" },
        { label: "OpenAI (GPT)", value: "openai" }
      ],
      admin: { description: "Proveedor que se usará por defecto para generar artículos" }
    },
    {
      type: "collapsible",
      label: "Anthropic (Claude)",
      fields: [
        {
          name: "anthropicApiKey",
          type: "text",
          admin: {
            description: "sk-ant-... · Obtén la clave en https://console.anthropic.com",
            placeholder: "sk-ant-api03-..."
          }
        },
        {
          name: "anthropicModel",
          type: "select",
          defaultValue: "claude-sonnet-4-5",
          options: [
            { label: "Claude Sonnet 4.5 (rápido, recomendado)", value: "claude-sonnet-4-5" },
            { label: "Claude Opus 4.1 (máxima calidad)", value: "claude-opus-4-1" },
            { label: "Claude Haiku 4 (económico)", value: "claude-haiku-4" }
          ]
        }
      ]
    },
    {
      type: "collapsible",
      label: "Google Gemini",
      fields: [
        {
          name: "geminiApiKey",
          type: "text",
          admin: {
            description: "Obtén la clave en https://aistudio.google.com/app/apikey",
            placeholder: "AIza..."
          }
        },
        {
          name: "geminiModel",
          type: "select",
          defaultValue: "gemini-2.0-flash",
          options: [
            { label: "Gemini 2.0 Flash (rápido)", value: "gemini-2.0-flash" },
            { label: "Gemini 2.0 Pro", value: "gemini-2.0-pro" },
            { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" }
          ]
        }
      ]
    },
    {
      type: "collapsible",
      label: "OpenAI",
      fields: [
        {
          name: "openaiApiKey",
          type: "text",
          admin: {
            description: "sk-... · Obtén la clave en https://platform.openai.com/api-keys",
            placeholder: "sk-proj-..."
          }
        },
        {
          name: "openaiModel",
          type: "select",
          defaultValue: "gpt-4o",
          options: [
            { label: "GPT-4o", value: "gpt-4o" },
            { label: "GPT-4o mini (económico)", value: "gpt-4o-mini" },
            { label: "GPT-4 Turbo", value: "gpt-4-turbo" }
          ]
        }
      ]
    },
    {
      name: "systemPrompt",
      type: "textarea",
      required: true,
      defaultValue:
        "Eres un editor periodístico profesional. Reescribe la siguiente noticia en español claro, objetivo y con estilo profesional. No inventes datos. Devuelve JSON con las claves: title (máx 120 chars), excerpt (máx 280 chars), body (3-6 párrafos), tags (array 3-6 strings), meta_title (máx 80), meta_description (máx 180).",
      admin: { description: "Prompt base de sistema que se envía a la IA al generar cada artículo" }
    },
    {
      name: "autoPublish",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Si está activo, los artículos generados se publican automáticamente. Si no, quedan como borrador." }
    },
    {
      name: "language",
      type: "select",
      defaultValue: "es",
      options: [
        { label: "Español", value: "es" },
        { label: "English", value: "en" }
      ],
      admin: { description: "Idioma objetivo de los artículos reescritos" }
    }
  ]
};
