/**
 * cal-modal.ts — Deferred Cal.com modal popup trigger (`/` hero "Book a call").
 *
 * Reuses `CAL` (`src/data/contact.ts`) and `getCalNamespace()` (`cal-loader.ts`)
 * so `embed.js` loads once per page load and shares Decbricks light UI styling.
 * Privacy & CWV: never fetches `embed.js` eagerly on page load; warms lazily
 * after consent (idle or hover/focus) and guarantees load + open on click.
 */
import { bus } from './core/gsap';
import { getLenis } from './smooth-scroll';
import { CAL } from '../data/contact';
import { getCalNamespace, hasConsent, type CalQueueObject } from './cal-loader';

const FALLBACK_TIMEOUT_MS = 8_000;

export function initCalModals(): () => void {
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-cal-modal][data-cal-link]')
  );
  if (triggers.length === 0) return () => {};

  let disposed = false;
  let warmTimer: ReturnType<typeof setTimeout> | undefined;
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  let idleId: number | undefined;
  let nsCal: CalQueueObject | undefined;
  let modalOpen = false;

  const ensureModalNamespace = (namespace: string) => {
    nsCal = getCalNamespace(namespace, CAL.origin);
    return nsCal;
  };

  const onWindowCalModalChange = (open: boolean) => {
    if (disposed || open === modalOpen) return;
    modalOpen = open;
    const lenis = getLenis();
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  };

  // Observe Cal's injected modal dialog element so Lenis pauses cleanly while open.
  const domObserver = new MutationObserver(() => {
    const isCalDialogOpen = Boolean(
      document.querySelector('cal-modal-box[state="loaded"], cal-modal-box[state="loading"]')
    );
    onWindowCalModalChange(isCalDialogOpen);
  });
  domObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['state'] });

  const scheduleWarm = () => {
    if (disposed || nsCal || !hasConsent()) return;
    const warm = () => {
      if (disposed || nsCal || !hasConsent()) return;
      ensureModalNamespace(triggers[0].dataset.calNamespace || CAL.namespace);
    };
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(warm, { timeout: 2500 });
    } else {
      warmTimer = setTimeout(warm, 1500);
    }
  };

  const onCookiesDecided = () => {
    scheduleWarm();
  };
  bus.on('cookies-decided', onCookiesDecided);
  scheduleWarm();

  const onHoverOrFocus = (e: Event) => {
    const btn = (e.currentTarget as HTMLElement | null);
    const ns = btn?.dataset.calNamespace || CAL.namespace;
    ensureModalNamespace(ns);
  };

  const onTriggerClick = (e: MouseEvent) => {
    const btn = e.currentTarget as HTMLButtonElement | null;
    if (!btn) return;
    const calLink = btn.dataset.calLink || CAL.link;
    if (!calLink) return;

    const ns = btn.dataset.calNamespace || CAL.namespace;
    let config: Record<string, unknown> = { layout: 'month_view' };
    if (btn.dataset.calConfig) {
      try {
        config = JSON.parse(btn.dataset.calConfig);
      } catch {
        // Keep safe default month_view config if data attribute is malformed.
      }
    }

    const wasLoaded = Boolean(window.Cal?.loaded);
    const api = ensureModalNamespace(ns);

    // If embed.js had not loaded before this click (e.g. first interaction without
    // prior warm-up), embed.js's [data-cal-link] click delegate wasn't registered yet,
    // so queue the explicit modal command to open cleanly as soon as embed.js executes.
    if (!wasLoaded) {
      api('modal', { calLink, config });
    }

    if (fallbackTimer) clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (disposed) return;
      const box = document.querySelector('cal-modal-box');
      if (window.Cal?.scriptFailed || !box) {
        if (CAL.bookingUrl) {
          window.open(CAL.bookingUrl, '_blank', 'noopener,noreferrer');
        }
      }
    }, FALLBACK_TIMEOUT_MS);
  };

  triggers.forEach((btn) => {
    btn.addEventListener('pointerenter', onHoverOrFocus, { passive: true });
    btn.addEventListener('focusin', onHoverOrFocus, { passive: true });
    btn.addEventListener('click', onTriggerClick);
  });

  return () => {
    disposed = true;
    domObserver.disconnect();
    onWindowCalModalChange(false);
    bus.off('cookies-decided', onCookiesDecided);
    if (warmTimer) clearTimeout(warmTimer);
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (idleId !== undefined && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId);
    }
    triggers.forEach((btn) => {
      btn.removeEventListener('pointerenter', onHoverOrFocus);
      btn.removeEventListener('focusin', onHoverOrFocus);
      btn.removeEventListener('click', onTriggerClick);
    });
  };
}
