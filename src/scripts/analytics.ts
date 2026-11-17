/**
 * analytics.ts — Consent-gated Google Tag Manager container + conversion events
 * (SEO ticket T-10, per docs/seo/08-measurement.md).
 *
 * The container (`GTM-MRLF44ZP`, owner-supplied snippet) is injected ONLY after
 * the cookie banner's analytics consent exists — same gate the Cal embed uses
 * (`cookies-decided` bus event + `analytics-consent` cookie). Visitors who
 * decline analytics are never counted: zero network requests to
 * googletagmanager.com are made pre-consent, verified in DevTools.
 *
 * Dev-mode guard: the container loads only on production builds
 * (`import.meta.env.PROD`), so local dev/preview testing never sends real hits.
 * Consent state itself is unaffected.
 *
 * Events (pushed into `window.dataLayer`, all consent-gated):
 * - `contact_form_submitted` — confirmed Formspree success only (contact.ts)
 * - `booking_started` / `booking_completed` — Cal inline embed lifecycle (cal-embed.ts)
 * - `page_view` (SPA) — pushed on every client-side route swap from main.ts
 *
 * The GTM container must map these names to GA4 tags/triggers; measurement
 * plan §C is the source of truth for names and properties.
 */
import { bus } from './core/gsap';

const GTM_ID = import.meta.env.PUBLIC_GTM_ID || 'GTM-MRLF44ZP';
const ANALYTICS_COOKIE = 'analytics-consent';

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const hasAnalyticsConsent = (): boolean =>
  document.cookie.split('; ').some((c) => c.startsWith(`${ANALYTICS_COOKIE}=true`));

let gtmRequested = false;

/** Replicates the owner-supplied GTM snippet, injected only after consent. */
const loadGtm = (): void => {
  if (gtmRequested || !import.meta.env.PROD) return;
  gtmRequested = true;
  window.dataLayer = window.dataLayer || [];
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
  const gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args as unknown as Record<string, unknown>);
  };
  gtag('js', new Date());
};

/** Push a conversion/signal event. No-op without analytics consent. */
export function trackEvent(event: string, params: EventParams = {}): void {
  if (!hasAnalyticsConsent()) return;
  window.dataLayer = window.dataLayer || [];
  const clean: Record<string, unknown> = { event };
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) clean[key] = value;
  }
  window.dataLayer.push(clean);
}

/** SPA page_view on client-side swaps (GTM container maps it to GA4). */
export function trackPageView(path: string): void {
  trackEvent('page_view', {
    page_path: path,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  });
}

/**
 * Boot once per document (pattern matches `initCookies`: no per-swap teardown —
 * the banner and consent state live across client-side transitions). If
 * consent already exists (returning visitor), load immediately.
 */
export function initAnalytics(): void {
  const onCookiesDecided = (granted: unknown) => {
    if (granted === true) {
      loadGtm();
    } else if (gtmRequested) {
      // Consent WITHDRAWN after the container already loaded (footer "Manage
      // cookies" → save with analytics unchecked). GTM's own tags would keep
      // running in this document, so mirror the banner's revoke path (the
      // "Delete" button in cookies.ts): clear the consent cookies and reload.
      // The fresh document boots without the container, and the banner re-asks.
      document.cookie = 'essential-consent=; max-age=0; path=/';
      document.cookie = 'analytics-consent=; max-age=0; path=/';
      window.location.reload();
    }
  };
  bus.on('cookies-decided', onCookiesDecided);
  if (hasAnalyticsConsent()) loadGtm();
}
