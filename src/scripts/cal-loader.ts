/**
 * cal-loader.ts — Shared Cal.com embed loader & Decbricks palette theme.
 *
 * Used by both `cal-embed.ts` (`/contact` inline widget) and `cal-modal.ts`
 * (`/` hero "Book a call" popup modal) so `embed.js` is injected once per
 * session and both UIs share the exact same `CAL` link, namespace, and theme.
 */
import { CAL } from '../data/contact';

export const CONSENT_COOKIE = 'essential-consent';

export const hasConsent = () =>
  document.cookie.split('; ').some((c) => c.startsWith(`${CONSENT_COOKIE}=`));

/**
 * Decbricks palette tokens supported by Cal.com embed's `cssVarsPerTheme`.
 * Keys intentionally omit leading `--` (Cal injects `--<key>` inside its iframe).
 */
export const CAL_THEME_VARS: Record<string, string> = {
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

export const CAL_UI_CONFIG = {
  theme: 'light' as const,
  cssVarsPerTheme: { light: CAL_THEME_VARS },
  hideEventTypeDetails: false,
};

export interface CalEventDetail {
  data?: {
    iframeHeight?: number;
    iframeWidth?: number;
    isFirstTime?: boolean;
  };
}

export interface CalQueueObject {
  (...args: unknown[]): void;
  loaded?: boolean;
  ns?: Record<string, CalQueueObject>;
  q?: unknown[];
  scriptFailed?: boolean;
}

declare global {
  interface Window {
    Cal?: CalQueueObject;
  }
}

const pushQueue = (target: CalQueueObject, args: IArguments | unknown[]) => {
  (target.q = target.q ?? []).push(args);
};

const createQueueFn = (): CalQueueObject => {
  const fn = function (...args: unknown[]) {
    pushQueue(fn, args);
  } as CalQueueObject;
  fn.q = [];
  return fn;
};

/**
 * Official vanilla Cal.com loader: creates the queue shim (`Cal` + `Cal.ns`),
 * injects `${origin}/embed/embed.js` async once per document, and exposes load state.
 */
export function ensureCal(origin = CAL.origin): CalQueueObject {
  if (window.Cal) return window.Cal;

  const cal = function (...args: unknown[]) {
    if (!cal.loaded && args[0] === 'init') {
      const ns = typeof args[1] === 'string' ? args[1] : '';
      const nsApi = cal.ns?.[ns] ?? createQueueFn();
      if (ns) {
        cal.ns = cal.ns ?? {};
        cal.ns[ns] = nsApi;
        pushQueue(cal, ['initNamespace', ns]);
      }
      pushQueue(nsApi, args);
      return;
    }
    pushQueue(cal, args);
  } as CalQueueObject;

  cal.loaded = false;
  cal.ns = {};
  cal.q = [];
  cal.scriptFailed = false;
  window.Cal = cal;

  if (!document.querySelector('script[data-cal-embed-js]')) {
    const script = document.createElement('script');
    script.src = `${origin}/embed/embed.js`;
    script.async = true;
    script.dataset.calEmbedJs = 'true';
    script.onload = () => {
      cal.loaded = true;
    };
    script.onerror = () => {
      cal.scriptFailed = true;
    };
    document.head.appendChild(script);
  }

  return cal;
}

const initedNamespaces = new Set<string>();
const uiConfiguredNamespaces = new Set<string>();

/** Returns an initialized Cal namespace queue with Decbricks light UI config applied once. */
export function getCalNamespace(
  namespace = CAL.namespace,
  origin = CAL.origin
): CalQueueObject {
  const cal = ensureCal(origin);
  if (!namespace) {
    if (!uiConfiguredNamespaces.has('__default')) {
      uiConfiguredNamespaces.add('__default');
      cal('ui', CAL_UI_CONFIG);
    }
    return cal;
  }

  if (!initedNamespaces.has(namespace)) {
    initedNamespaces.add(namespace);
    cal('init', namespace, { origin });
  }

  const nsApi = cal.ns?.[namespace] ?? cal;
  if (!uiConfiguredNamespaces.has(namespace)) {
    uiConfiguredNamespaces.add(namespace);
    nsApi('ui', CAL_UI_CONFIG);
  }
  return nsApi;
}
