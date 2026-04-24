import { buildConfig } from "payload";
import type { CollectionConfig, GlobalConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
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
import { getActiveProfile } from "./src/site-profiles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profile = getActiveProfile();
const { features, branding, localization } = profile;

/**
 * Decide whether to turn on SSL for the Postgres pool.
 *
 * Heuristic (intentionally loose):
 *   1. Explicit opt-in via `DATABASE_SSL=true`.
 *   2. URL contains `sslmode=require` (what most managed providers emit).
 *   3. Host matches a known managed-Postgres suffix.
 * Local (`localhost` / `127.0.0.1`) always returns false so `docker-compose
 * up postgres` works out of the box.
 */
function needsManagedPgSsl(url: string | undefined): boolean {
  if (process.env.DATABASE_SSL === "true") return true;
  if (process.env.DATABASE_SSL === "false") return false;
  if (!url) return false;
  if (/^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(url)) {
    return false;
  }
  if (/sslmode=require/i.test(url)) return true;
  if (/\.(railway|neon\.tech|supabase\.co|render\.com|herokuapp\.com|rds\.amazonaws\.com|azure\.com|digitalocean\.com|aws\.neon\.tech)\b/i.test(url)) {
    return true;
  }
  return false;
}

// Collections are built from the profile's feature flags. Users + Media are
// always included (required by Payload auth + uploads).
const collections: CollectionConfig[] = [Users, Media];
if (features.news) {
  collections.push(Categories, Sources, Articles);
} else if (features.inlineEditor || features.seoAdvanced) {
  // Even without the news pipeline, simple-blog deployments still want Articles
  // + Categories for hand-written posts.
  collections.push(Categories, Articles);
}
if (features.landingPages) {
  collections.push(LandingPages);
}

const globals: GlobalConfig[] = [];
if (features.ai) globals.push(AISettings);
if (features.googleTags) globals.push(GoogleSettings);

// Admin views — approval queue only makes sense when news pipeline is on.
type AdminViewMap = NonNullable<NonNullable<Parameters<typeof buildConfig>[0]["admin"]>["components"]>["views"];
const adminViews: AdminViewMap = {
  dashboard: { Component: "@/components/admin/Dashboard#default" },
};
if (features.news && adminViews) {
  adminViews.approvalQueue = {
    Component: "@/components/admin/ApprovalQueueView#default",
    path: "/cola-aprobacion",
  };
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: branding.titleSuffix,
      icons: [],
      description: branding.description,
    },
    components: {
      views: adminViews,
      graphics: {
        Logo: "@/components/admin/Logo#default",
        Icon: "@/components/admin/Icon#default",
      },
    },
  },
  collections,
  globals,
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "dev-only-change-me",
  typescript: { outputFile: path.resolve(__dirname, "payload-types.ts") },
  db: postgresAdapter({
    // Auto-sync schema on startup. Payload will create/alter tables to match
    // the collections config. Useful for first deploys; switch to formal
    // migrations (`payload migrate`) once the schema stabilises.
    push: true,
    pool: {
      connectionString:
        process.env.DATABASE_URL || "postgresql://news:news@localhost:5432/news_db",
      // Cloud Postgres (Railway, Neon, Supabase, Heroku, Render…) terminates
      // TLS with a certificate the Node `pg` driver doesn't trust by default.
      // Enable SSL with `rejectUnauthorized: false` whenever the URL either
      // requests it via `sslmode=require` or matches a known managed host.
      // Local development (`localhost`) keeps SSL off.
      ssl: needsManagedPgSsl(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : undefined,
    },
  }),
  sharp,
  localization,
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  cors: [process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"],
  csrf: [process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"]
});
