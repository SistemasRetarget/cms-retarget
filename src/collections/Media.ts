import type { CollectionConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
    group: "Contenido"
  },
  access: { read: () => true },
  upload: {
    staticDir: path.resolve(__dirname, "../../public/media"),
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 576, position: "centre" },
      { name: "hero", width: 1920, height: 1080, position: "centre" }
    ]
  },
  fields: [
    { name: "alt", type: "text", required: true, localized: true },
    { name: "caption", type: "text", localized: true }
  ]
};
