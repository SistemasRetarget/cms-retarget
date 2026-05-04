import type { CollectionConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateImageBuffer } from "@/lib/imageValidator";
import { logger } from "@/lib/logger";

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
  hooks: {
    beforeOperation: [
      async ({ operation, req }) => {
        if (operation !== "create" && operation !== "update") return;
        const file = req.file;
        if (!file || !file.data) return;

        const result = await validateImageBuffer(
          file.data as Buffer,
          file.mimetype
        );
        if (!result.ok) {
          logger.warn(
            { filename: file.name, mimetype: file.mimetype, error: result.error },
            "Image validation failed"
          );
          throw new Error(`Imagen inválida: ${result.error}`);
        }
        logger.info(
          { filename: file.name, ...result.meta },
          "Image validated"
        );
      }
    ]
  },
  fields: [
    { name: "alt", type: "text", required: true, localized: true },
    { name: "caption", type: "text", localized: true }
  ]
};
