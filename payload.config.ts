import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Users } from "./src/collections/Users";
import { Media } from "./src/collections/Media";
import { Categories } from "./src/collections/Categories";
import { Sources } from "./src/collections/Sources";
import { Articles } from "./src/collections/Articles";
import { LandingPages } from "./src/collections/LandingPages";
import { AISettings } from "./src/globals/AISettings";
import { GoogleSettings } from "./src/globals/GoogleSettings";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "· News AI CMS",
      icons: [],
      description: "Panel de administración — News AI CMS"
    },
    components: {
      views: {
        dashboard: { Component: "@/components/admin/Dashboard#default" },
        approvalQueue: {
          Component: "@/components/admin/ApprovalQueueView#default",
          path: "/cola-aprobacion"
        }
      },
      graphics: {
        Logo: "@/components/admin/Logo#default",
        Icon: "@/components/admin/Icon#default"
      }
    }
  },
  collections: [Users, Media, Categories, Sources, Articles, LandingPages],
  globals: [AISettings, GoogleSettings],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "dev-only-change-me",
  typescript: { outputFile: path.resolve(__dirname, "payload-types.ts") },
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URL || "file:./data/news.db" } }),
  sharp,
  localization: {
    locales: [
      { label: "Español", code: "es" },
      { label: "English", code: "en" }
    ],
    defaultLocale: "es",
    fallback: true
  },
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  cors: [process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"],
  csrf: [process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"]
});
