"use client";

import { useReportWebVitals } from "next/web-vitals";

type GTagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Forward to Google Analytics if GA is loaded (via NEXT_PUBLIC_GA_ID)
    const w = window as GTagWindow;
    if (typeof w.gtag === "function") {
      w.gtag("event", metric.name, {
        event_category: "Web Vitals",
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Dev: log to console for inspection
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[vitals] ${metric.name}: ${Math.round(metric.value)}`, metric);
    }
  });

  return null;
}
