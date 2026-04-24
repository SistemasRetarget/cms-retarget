import type { Metadata } from "next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { WebVitals } from "@/components/WebVitals";

export const metadata: Metadata = {
  title: { default: "News AI · Blog de noticias con IA", template: "%s · News AI" },
  description: "Blog de noticias curadas y reescritas por IA desde múltiples fuentes.",
  robots: { index: true, follow: true }
};

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAnalytics />
      <WebVitals />
      {children}
    </>
  );
}
