/**
 * GoogleAnalytics — inyección de GTM y GA4 sin bloquear el render.
 *
 * Estrategia de performance:
 * - strategy="afterInteractive": los scripts se cargan DESPUÉS de que la página
 *   es interactiva. No bloquean ni el parser ni el render principal.
 * - GTM tiene prioridad: si hay GTM ID configurado, GA4 debe instalarse desde
 *   el contenedor de GTM, no duplicarse aquí.
 * - Los datos se leen en el servidor (Server Component), cero JS extra en el cliente.
 */

import Script from "next/script";
import { getPayload } from "payload";
import config from "@payload-config";

interface GoogleConfig {
  enabled?: boolean;
  gtmId?: string;
  ga4Id?: string;
  anonymizeIp?: boolean;
}

async function getGoogleSettings(): Promise<GoogleConfig> {
  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({ slug: "google-settings" });
    return settings as GoogleConfig;
  } catch {
    return {};
  }
}

export default async function GoogleAnalytics() {
  const cfg = await getGoogleSettings();

  if (!cfg.enabled) return null;

  const hasGTM = cfg.gtmId && /^GTM-[A-Z0-9]+$/i.test(cfg.gtmId);
  const hasGA4 = cfg.ga4Id && /^G-[A-Z0-9]+$/i.test(cfg.ga4Id);

  // Si hay GTM, él gestiona GA4 → no inyectamos GA4 directamente
  if (hasGTM) {
    return (
      <>
        {/* GTM Script — afterInteractive: no bloquea render */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${cfg.gtmId}');`
          }}
        />
        {/* GTM noscript fallback — se incluye vía layout body */}
        <Script
          id="gtm-noscript-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
if(!document.getElementById('gtm-noscript')){
  var ns=document.createElement('noscript');
  ns.id='gtm-noscript';
  var iframe=document.createElement('iframe');
  iframe.src='https://www.googletagmanager.com/ns.html?id=${cfg.gtmId}';
  iframe.height='0';iframe.width='0';
  iframe.style.cssText='display:none;visibility:hidden';
  ns.appendChild(iframe);
  document.body.insertBefore(ns,document.body.firstChild);
}`
          }}
        />
      </>
    );
  }

  // Solo GA4 sin GTM
  if (hasGA4) {
    return (
      <>
        <Script
          id="ga4-script"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${cfg.ga4Id}`}
        />
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${cfg.ga4Id}', {
  anonymize_ip: ${cfg.anonymizeIp !== false},
  send_page_view: true
});`
          }}
        />
      </>
    );
  }

  return null;
}
