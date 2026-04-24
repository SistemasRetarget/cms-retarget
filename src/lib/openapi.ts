export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "News AI CMS API",
    version: "1.0.0",
    description:
      "Public API for News AI CMS — article approval workflow, trends analysis, and landing page generation.",
  },
  servers: [
    { url: "/api/v1", description: "v1 (stable)" },
    { url: "/api", description: "unversioned alias to v1" },
  ],
  tags: [
    { name: "articles", description: "News article workflow" },
    { name: "trends", description: "LLM-powered trend analysis" },
    { name: "landing-pages", description: "AI-generated landing pages" },
    { name: "analyzer", description: "Site analyzer / cloner" },
    { name: "site", description: "Site profile metadata" },
    { name: "health", description: "Liveness and readiness" },
  ],
  components: {
    securitySchemes: {
      payloadCookie: {
        type: "apiKey",
        in: "cookie",
        name: "payload-token",
        description: "Authenticated Payload CMS session cookie",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "object", additionalProperties: true },
        },
        required: ["error"],
      },
      ArticleRef: {
        type: "object",
        properties: {
          id: { oneOf: [{ type: "string" }, { type: "integer" }] },
          title: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["health"],
        summary: "Liveness probe",
        responses: {
          "200": {
            description: "Service is alive",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        tags: ["health"],
        summary: "Readiness probe (checks DB connectivity)",
        responses: {
          "200": { description: "Ready" },
          "503": { description: "Not ready (DB error)" },
        },
      },
    },
    "/articles/approve": {
      post: {
        tags: ["articles"],
        summary: "Approve an article (editor/admin only)",
        security: [{ payloadCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: { id: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Article approved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    article: { $ref: "#/components/schemas/ArticleRef" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid body", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient role" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/articles/reject": {
      post: {
        tags: ["articles"],
        summary: "Reject an article back to draft",
        security: [{ payloadCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: {
                  id: { type: "string" },
                  reason: { type: "string", maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Article rejected" },
          "400": { description: "Invalid body" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient role" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/articles/queue": {
      get: {
        tags: ["articles"],
        summary: "Fetch articles pending review",
        security: [{ payloadCookie: [] }],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category slug" },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
        ],
        responses: {
          "200": { description: "Queue returned" },
          "400": { description: "Invalid query" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/trends": {
      get: {
        tags: ["trends"],
        summary: "Analyze trending topics over a time window",
        security: [{ payloadCookie: [] }],
        parameters: [
          { name: "window", in: "query", schema: { type: "string", enum: ["24h", "48h"], default: "24h" } },
          { name: "bypass_cache", in: "query", schema: { type: "boolean", default: false } },
        ],
        responses: {
          "200": { description: "Trends analyzed" },
          "400": { description: "Missing AI provider key" },
          "401": { description: "Not authenticated" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      delete: {
        tags: ["trends"],
        summary: "Invalidate the trends cache",
        security: [{ payloadCookie: [] }],
        responses: { "200": { description: "Cache invalidated" }, "401": { description: "Not authenticated" } },
      },
    },
    "/analyzer": {
      post: {
        tags: ["analyzer"],
        summary: "Analyze a public URL and return a SiteBlueprint (editor/admin)",
        security: [{ payloadCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", format: "uri", maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Site analyzed — blueprint returned" },
          "400": { description: "Invalid URL" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient role" },
          "404": { description: "Feature disabled on this profile" },
          "429": { description: "Rate limit exceeded" },
          "500": { description: "Fetch/analyze error" },
        },
      },
    },
    "/site/profile": {
      get: {
        tags: ["site"],
        summary: "Active site profile (features, branding, SEO defaults)",
        responses: {
          "200": {
            description: "Profile returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    features: { type: "object", additionalProperties: { type: "boolean" } },
                    branding: { type: "object", additionalProperties: true },
                    seo: { type: "object", additionalProperties: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/landing-pages/generate": {
      post: {
        tags: ["landing-pages"],
        summary: "Generate a landing page from a brief using AI (admin only)",
        security: [{ payloadCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["topic", "audience", "goal"],
                properties: {
                  topic: { type: "string", minLength: 5, maxLength: 200 },
                  audience: { type: "string", minLength: 5, maxLength: 200 },
                  goal: { type: "string", minLength: 5, maxLength: 200 },
                  tone: { type: "string", maxLength: 50 },
                  sections: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Landing page created as draft" },
          "400": { description: "Invalid body or missing AI key" },
          "401": { description: "Not authorized (admin only)" },
          "429": { description: "Rate limit exceeded" },
          "500": { description: "AI generation failure" },
        },
      },
    },
  },
} as const;
