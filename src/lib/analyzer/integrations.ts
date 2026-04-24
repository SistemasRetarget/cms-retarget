import type { CheerioAPI } from "cheerio";
import type { DetectedIntegration, IntegrationCategory, TrackerId } from "./types";

/**
 * Detect marketing, analytics, chat and CMP integrations by looking at
 * <script> src attributes and inline script contents.
 *
 * The registry below is intentionally pattern-based rather than AST-based —
 * sites obfuscate things aggressively and patterns catch most real-world cases
 * without needing a full JS parser.
 */

interface Matcher {
  id: TrackerId;
  label: string;
  category: IntegrationCategory;
  /** Regex applied to either the script src or the inline body. */
  patterns: RegExp[];
  /** Optional extractor that pulls an account id (e.g. G-XXXX) from the match. */
  idExtractor?: (hay: string) => string | undefined;
}

const MATCHERS: Matcher[] = [
  {
    id: "ga4",
    label: "Google Analytics 4",
    category: "analytics",
    patterns: [/gtag\.js\?id=G-[A-Z0-9]+/, /gtag\("config",\s*"G-[A-Z0-9]+"/],
    idExtractor: (s) => s.match(/G-[A-Z0-9]+/)?.[0],
  },
  {
    id: "ua",
    label: "Universal Analytics (UA)",
    category: "analytics",
    patterns: [/UA-\d+-\d+/],
    idExtractor: (s) => s.match(/UA-\d+-\d+/)?.[0],
  },
  {
    id: "gtm",
    label: "Google Tag Manager",
    category: "tagmanager",
    patterns: [/googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+/, /GTM-[A-Z0-9]{4,}/],
    idExtractor: (s) => s.match(/GTM-[A-Z0-9]+/)?.[0],
  },
  {
    id: "meta_pixel",
    label: "Meta (Facebook) Pixel",
    category: "ads",
    patterns: [/connect\.facebook\.net\/.+\/fbevents\.js/, /fbq\(\s*"init"\s*,\s*"\d+"/],
    idExtractor: (s) => s.match(/fbq\(\s*"init"\s*,\s*"(\d+)"/)?.[1],
  },
  {
    id: "tiktok_pixel",
    label: "TikTok Pixel",
    category: "ads",
    patterns: [/analytics\.tiktok\.com\/i18n\/pixel\/events\.js/, /ttq\.load\("/],
    idExtractor: (s) => s.match(/ttq\.load\("([A-Z0-9]+)"/)?.[1],
  },
  {
    id: "linkedin_insight",
    label: "LinkedIn Insight Tag",
    category: "ads",
    patterns: [/snap\.licdn\.com\/li\.lms-analytics\/insight\.min\.js/, /_linkedin_partner_id/],
    idExtractor: (s) => s.match(/_linkedin_partner_id\s*=\s*"(\d+)"/)?.[1],
  },
  {
    id: "twitter_pixel",
    label: "Twitter / X Pixel",
    category: "ads",
    patterns: [/static\.ads-twitter\.com\/uwt\.js/, /twq\("config",\s*"[a-z0-9]+"/],
  },
  {
    id: "pinterest_tag",
    label: "Pinterest Tag",
    category: "ads",
    patterns: [/s\.pinimg\.com\/ct\/core\.js/, /pintrk\("load",\s*"\d+"/],
  },
  {
    id: "reddit_pixel",
    label: "Reddit Pixel",
    category: "ads",
    patterns: [/www\.redditstatic\.com\/ads\/pixel\.js/, /rdt\("init",\s*"[^"]+"/],
  },
  {
    id: "snapchat_pixel",
    label: "Snapchat Pixel",
    category: "ads",
    patterns: [/sc-static\.net\/scevent\.min\.js/, /snaptr\("init",\s*"[^"]+"/],
  },
  {
    id: "hotjar",
    label: "Hotjar",
    category: "analytics",
    patterns: [/static\.hotjar\.com\/c\/hotjar-\d+\.js/, /hjid:\s*\d+/],
    idExtractor: (s) => s.match(/hjid:\s*(\d+)/)?.[1],
  },
  {
    id: "clarity",
    label: "Microsoft Clarity",
    category: "analytics",
    patterns: [/www\.clarity\.ms\/tag\/[a-z0-9]+/, /clarity\("[A-Za-z0-9]+"/],
  },
  {
    id: "segment",
    label: "Segment",
    category: "analytics",
    patterns: [/cdn\.segment\.com\/analytics\.js/, /analytics\.load\("[^"]+"/],
  },
  {
    id: "mixpanel",
    label: "Mixpanel",
    category: "analytics",
    patterns: [/cdn\.mxpnl\.com\/libs\/mixpanel/, /mixpanel\.init\("[a-f0-9]+"/],
  },
  {
    id: "amplitude",
    label: "Amplitude",
    category: "analytics",
    patterns: [/cdn\.amplitude\.com\/libs\/amplitude/, /amplitude\.getInstance\(\)\.init\("[a-f0-9]+"/],
  },
  {
    id: "plausible",
    label: "Plausible",
    category: "analytics",
    patterns: [/plausible\.io\/js\//],
  },
  {
    id: "fathom",
    label: "Fathom Analytics",
    category: "analytics",
    patterns: [/cdn\.usefathom\.com\/script\.js/],
  },
  {
    id: "matomo",
    label: "Matomo",
    category: "analytics",
    patterns: [/matomo\.js/, /_paq\.push/],
  },
  {
    id: "intercom",
    label: "Intercom",
    category: "chat",
    patterns: [/widget\.intercom\.io\/widget\//, /Intercom\("boot"/],
  },
  {
    id: "drift",
    label: "Drift",
    category: "chat",
    patterns: [/js\.driftt\.com\/include\//, /drift\.load\("[a-z0-9]+"/],
  },
  {
    id: "crisp",
    label: "Crisp",
    category: "chat",
    patterns: [/client\.crisp\.chat\/l\.js/, /CRISP_WEBSITE_ID/],
  },
  {
    id: "zendesk",
    label: "Zendesk Chat",
    category: "chat",
    patterns: [/static\.zdassets\.com\/ekr\/snippet\.js/, /zopim/],
  },
  {
    id: "hubspot",
    label: "HubSpot",
    category: "crm",
    patterns: [/js\.hs-scripts\.com\/\d+\.js/, /js\.hsforms\.net\//],
    idExtractor: (s) => s.match(/js\.hs-scripts\.com\/(\d+)\.js/)?.[1],
  },
  {
    id: "cookiebot",
    label: "Cookiebot",
    category: "cmp",
    patterns: [/consent\.cookiebot\.com\/uc\.js/],
  },
  {
    id: "onetrust",
    label: "OneTrust",
    category: "cmp",
    patterns: [/cdn\.cookielaw\.org\/scripttemplates\//, /OneTrust/],
  },
  {
    id: "google_ads",
    label: "Google Ads (AW)",
    category: "ads",
    patterns: [/googleadservices\.com\/pagead\/conversion\//, /AW-\d+/],
    idExtractor: (s) => s.match(/AW-\d+/)?.[0],
  },
  {
    id: "bing_ads",
    label: "Microsoft/Bing Ads",
    category: "ads",
    patterns: [/bat\.bing\.com\/bat\.js/, /uetq\.push/],
  },
  {
    id: "recaptcha",
    label: "Google reCAPTCHA",
    category: "captcha",
    patterns: [/www\.google\.com\/recaptcha\/api\.js/, /grecaptcha\.render/],
  },
  {
    id: "turnstile",
    label: "Cloudflare Turnstile",
    category: "captcha",
    patterns: [/challenges\.cloudflare\.com\/turnstile\/v\d+\/api\.js/],
  },
];

export function detectIntegrations($: CheerioAPI, rawHtml: string): DetectedIntegration[] {
  const found = new Map<TrackerId, DetectedIntegration>();

  // Collect all script src/content first — cheaper than running all matchers per script.
  const scripts: string[] = [];
  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) scripts.push(src);
    const inner = $(el).html();
    if (inner) scripts.push(inner);
  });
  const haystack = scripts.join("\n") + "\n" + rawHtml;

  for (const m of MATCHERS) {
    for (const p of m.patterns) {
      const match = haystack.match(p);
      if (match) {
        const accountId = m.idExtractor?.(haystack);
        found.set(m.id, {
          id: m.id,
          label: m.label,
          category: m.category,
          accountId,
          evidence: match[0].slice(0, 120),
        });
        break;
      }
    }
  }

  return Array.from(found.values());
}
