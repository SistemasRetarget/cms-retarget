import { z } from "zod";

// Article approval request
export const approveArticleSchema = z.object({
  id: z.string().min(1, "Article ID is required"),
});

export type ApproveArticleRequest = z.infer<typeof approveArticleSchema>;

// Article rejection request
export const rejectArticleSchema = z.object({
  id: z.string().min(1, "Article ID is required"),
  reason: z.string().max(2000, "Reason cannot exceed 2000 characters").optional(),
});

export type RejectArticleRequest = z.infer<typeof rejectArticleSchema>;

// Article queue query parameters
export const articleQueueQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type ArticleQueueQuery = z.infer<typeof articleQueueQuerySchema>;

// Trends analysis query parameters
export const trendsQuerySchema = z.object({
  window: z.enum(["24h", "48h"]).default("24h"),
  bypass_cache: z.coerce.boolean().default(false),
});

export type TrendsQuery = z.infer<typeof trendsQuerySchema>;

// Landing page generation request (from AI brief)
export const generateLandingPageSchema = z.object({
  topic: z.string().min(5).max(200, "Topic must be between 5 and 200 characters"),
  audience: z.string().min(5).max(200, "Audience must be between 5 and 200 characters"),
  goal: z.string().min(5).max(200, "Goal must be between 5 and 200 characters"),
  tone: z.string().max(50, "Tone must not exceed 50 characters").optional(),
  sections: z.array(z.string().max(50)).optional(),
});

export type GenerateLandingPageRequest = z.infer<typeof generateLandingPageSchema>;

// Site analyzer request
export const analyzeSiteSchema = z.object({
  url: z
    .string()
    .url("Invalid URL")
    .max(2000, "URL too long")
    .refine((u) => /^https?:\/\//i.test(u), "URL must use http(s)"),
});

export type AnalyzeSiteRequest = z.infer<typeof analyzeSiteSchema>;
