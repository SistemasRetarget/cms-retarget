export type Platform =
  | "web"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "rss";

export type MediaType = "article" | "video" | "reel" | "post" | "short";

export interface CollectedItem {
  title: string;
  content: string;      // texto principal para la IA
  url: string;          // URL original
  platform: Platform;
  mediaType: MediaType;
  language?: string;
  publishedAt?: string;
  author?: string;
  thumbnail?: string;
}

export type SourceType =
  | "rss"
  | "html"
  | "sitemap"
  | "youtube_channel"
  | "youtube_video"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "url_auto";
