import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug", "order"], group: "Noticias" },
  access: { read: () => true },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea", localized: true },
    { name: "color", type: "text", admin: { description: "Color hex para badges (#4A7C3A)" } },
    { name: "order", type: "number", defaultValue: 0 }
  ]
};
