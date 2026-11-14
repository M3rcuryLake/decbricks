/**
 * cal-embed.ts — Cal.com inline embed lifecycle (map 5A).
 *
 * - Lazy: IntersectionObserver (rootMargin 400px) — nothing loads until the
 *   block nears the viewport, so it never hurts LCP/INP on other pages.
 * - Privacy: Cal.com embeds set third-party cookies, so `embed.js` is only
 *   loaded after the CookieBanner has stored consent (see cookies.ts, which
 *   emits 'cookies-decided'). Without consent we show the fallback card.
 * - Official vanilla loader (queue + `Cal(...)` namespacing); embed.js is
 *   injected exactly once per page load even across client-side swaps.
 *   `Cal('inline')` is re-run only when a NEW mount element appears (new page
 *   visit); WeakSet guard prevents double init on the same node.
 * - Failure paths: script error / on('linkFailed') / sanity timeout (10 s)
 *   all swap in the server-rendered fallback card (Cal deep link, email,
 *   phones) with a `role="status"` announcement, never a blank box.
 * - `bookingSuccessful` → confirmation announcement, focus moved to it.
 *
 * initCalEmbed() returns a teardown; registered in main.ts boot + onAfterSwap.
 */
import { bus } from './core/gsap';
import { CAL } from '../data/contact';

const CONSENT_COOKIE = 'essential-consent';
const SCRIPT_TIMEOUT_MS = 10_000;

/**
 * Decbricks palette tokens supported by Cal.com embed's `cssVarsPerTheme`.
 * Keys intentionally omit leading `--` (Cal injects `--<key>` inside its iframe).
 * Verified against Cal v2 embed stylesheet variables on the live widget.
 */
const CAL_THEME_VARS: Record<string, string> = {
  // Brand & interactive emphasis
  'cal-brand': '#800020',
  'cal-brand-emphasis': '#630018',
  'cal-brand-text': '#FFF9F2',
  'cal-bg-brand': '#800020',
  'cal-bg-brand-emphasis': '#630018',
  'cal-bg-brand-muted': '#F3E6D5',
  'cal-bg-primary': '#800020',
  'cal-bg-primary-emphasis': '#630018',
  'cal-bg-primary-muted': '#F3E6D5',

  // Card surfaces (Warm Off-White card + Warm Beige tiles/hover)
  'cal-bg': '#FFF9F2',
  'cal-bg-muted': '#FAF0E4',
  'cal-bg-subtle': '#F3E6D5',
  'cal-bg-emphasis': '#EAD7C0',
  'cal-bg-inverted': '#800020',

  // Typography (Burgundy-ink hierarchy, all >= 4.5:1 on #FFF9F2 / #EAD7C0)
  'cal-text-emphasis': '#3D000F',
  'cal-text': '#4A0E1E',
  'cal-text-subtle': '#6B2D3B',
  'cal-text-muted': '#743643',
  'cal-text-inverted': '#FFF9F2',

  // Hairlines & interactive button outlines (>= 3:1 UI boundary contrast)
  'cal-border-booker': '#DFCBB7',
  'cal-border': '#AE7480',
  'cal-border-subtle': '#E4D1BF',
  'cal-border-muted': '#EDE0D2',
  'cal-border-emphasis': '#800020',

  // Sage/Olive supporting semantic tones (tokens §2c)
  'cal-bg-semantic-success-subtle': '#E6ECE0',
  'cal-bg-semantic-success-emphasis': '#5A6432',
  'cal-text-semantic-success': '#5A6432',
};

interface CalEventDetail {
  data?: {
    iframeHeight?: number;
    iframeWidth?: number;
    isFirstTime?: boolean;
  };
}

interface CalQueueObject {
  (...args: unknown[]): void;
  loaded?: boolean;
  ns?: Record<string, unknown>;
  q?: unknown[];
  scriptFailed?: boolean;
}

declare global {
  interface Window {
    Cal?: CalQueueObject;
  }
}

const hasConsent = () => document.cookie.split('; ').some((c) => c.startsWith(CONSENT_COOKIE + '='));

/** Official inline-embed loader shape: a queue consumed by embed.js. Loads once. */
function ensureCal(origin: string): CalQueueObject {
  if (window.Cal) return window.Cal;
  const cal = ((...args: unknown[]) => {
    (cal.q = cal.q ?? []).push(args);
  }) as CalQueueObject;
  cal.loaded = false;
  cal.ns = {};
  cal.scriptFailed = false;
  window.Cal = cal;
  const script = document.createElement('script');
  script.src = `${origin}/embed/embed.js`;
  script.async = true;
  script.onload = () => {
    cal.loaded = true;
  };
  script.onerror = () => {
    cal.scriptFailed = true;
  };
  document.head.appendChild(script);
  return cal;
}

/** Mounts initialised this page-load; new nodes (post-swap) are re-initialised. */
const initedMounts = new WeakSet<HTMLElement>();

export function initCalEmbed() {
  const root = document.querySelector<HTMLElement>('.cal-embed-widget');
  if (!root) return;

  const frame = root.querySelector<HTMLElement>('.cal-frame');
  const mount = root.querySelector<HTMLElement>('.cal-embed');
  const fallback = root.querySelector<HTMLElement>('.cal-fallback');
  const status = root.querySelector<HTMLElement>('.cal-status');

  // No Cal link configured: fallback card is already visible server-side
  // (DEV warning lives in CalEmbed.astro). Never load embed.js with an empty link.
  if (!mount || !CAL.link) return;

  let disposed = false;

  const say = (message: string) => {
    if (status) {
      status.textContent = message;
      status.focus({ preventScroll: true });
    }
  };

  const showFallback = (announce?: string) => {
    if (frame) {
      frame.classList.add('is-hidden');
    }
    if (mount) {
      mount.classList.add('is-hidden');
      mount.style.display = 'none';
      mount.setAttribute('aria-hidden', 'true');
    }
    if (fallback) {
      fallback.classList.remove('is-hidden');
      // Voice the reason, then park focus on the first usable contact link.
      if (announce) say(announce);
      fallback.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    }
  };

  const revealEmbed = (ready = false) => {
    if (frame) {
      frame.classList.remove('is-hidden');
      if (ready) frame.setAttribute('data-cal-ready', 'true');
    }
    mount.classList.remove('is-hidden');
    mount.style.display = '';
    mount.setAttribute('aria-busy', ready ? 'false' : 'true');
    mount.setAttribute('aria-hidden', 'false');
    fallback?.classList.add('is-hidden');
  };

  let sanity: ReturnType<typeof setTimeout> | undefined;
  let calObj: CalQueueObject | undefined;

  const onBookingSuccess = () => {
    if (disposed) return;
    say('Your meeting is booked — a confirmation is on its way. Talk soon!');
  };

  const onLinkFailed = () => {
    if (disposed) return;
    showFallback(
      'The booking calendar link did not open. Use the contact options above, or send the form below.'
    );
  };

  const onDimensionChanged = (e: unknown) => {
    if (disposed) return;
    const detail = (e as { detail?: CalEventDetail } | undefined)?.detail;
    const data = detail?.data;
    if (!data || typeof data.iframeHeight !== 'number' || data.iframeHeight <= 0) return;

    // Cal fires an initial `isFirstTime: true` ~300px ping before hydrating;
    // keep the skeleton reserve intact until real widget dimensions arrive.
    if (data.isFirstTime) return;

    const nextHeight = Math.ceil(data.iframeHeight);
    if (nextHeight <= 0) return;

    mount.style.minHeight = '0px';
    mount.style.height = 'auto';
    if (frame) {
      frame.style.minHeight = '0px';
      frame.setAttribute('data-cal-ready', 'true');
    }
    mount.setAttribute('aria-busy', 'false');
    if (sanity) {
      clearTimeout(sanity);
      sanity = undefined;
    }
  };

  const initInline = (): boolean => {
    if (initedMounts.has(mount)) return false;
    initedMounts.add(mount);
    const cal = ensureCal(CAL.origin);
    calObj = cal;
    try {
      cal('inline', {
        elementOrSelector: mount,
        calLink: CAL.link,
        layout: 'month_view',
      });
      cal('ui', {
        theme: 'light',
        cssVarsPerTheme: { light: CAL_THEME_VARS },
        hideEventTypeDetails: false,
      });
      cal('on', { action: 'bookingSuccessful', callback: onBookingSuccess });
      cal('on', { action: 'linkFailed', callback: onLinkFailed });
      cal('on', { action: '__dimensionChanged', callback: onDimensionChanged });
    } catch {
      showFallback('The booking calendar could not load. Use the contact options above, or send the form below.');
      return true; // gave up; do not retry within this page life
    }
    // Sanity check: if embed.js never materialises (script error, blocked
    // network), swap to the fallback instead of showing a perpetual skeleton.
    sanity = setTimeout(() => {
      if (disposed) return;
      const calReady = window.Cal?.loaded && !window.Cal?.scriptFailed;
      if (calReady && mount.querySelector('iframe')) {
        revealEmbed(true);
      } else {
        showFallback('The booking calendar is taking longer than usual. Use the contact options above, or send the form below.');
      }
    }, SCRIPT_TIMEOUT_MS);
    return false;
  };

  let loadStarted = hasConsent();
  let observed = false;

  /** Begin the (consented) load: queue the inline embed, reveal the skeleton. */
  const start = () => {
    if (initInline()) return; // init failed; fallback already shown
    revealEmbed();
  };

  const onCookiesDecided = () => {
    if (hasConsent() && !loadStarted) {
      loadStarted = true;
      // If the user reaches consent right after the section appeared, swap
      // the fallback card back for the (loading) embed.
      if (observed) start();
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      observed = true;
      if (loadStarted) {
        start();
      } else {
        // Waiting for cookie consent: keep the fallback card visible.
        showFallback();
      }
    },
    { rootMargin: '400px 0px' }
  );

  observer.observe(mount);

  bus.on('cookies-decided', onCookiesDecided);

  return () => {
    disposed = true;
    observer.disconnect();
    if (sanity) clearTimeout(sanity);
    bus.off('cookies-decided', onCookiesDecided);
    if (calObj) {
      try {
        calObj('off', { action: 'bookingSuccessful', callback: onBookingSuccess });
        calObj('off', { action: 'linkFailed', callback: onLinkFailed });
        calObj('off', { action: '__dimensionChanged', callback: onDimensionChanged });
      } catch {
        // embed.js may still be loading; `disposed` flag guards any late call.
      }
    }
  };
}
