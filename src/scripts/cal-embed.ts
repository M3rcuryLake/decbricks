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
import { bus, prefersReducedMotion } from './core/gsap';
import { getLenis } from './smooth-scroll';
import { CAL } from '../data/contact';
import {
  getCalNamespace,
  hasConsent,
  type CalEventDetail,
  type CalQueueObject,
} from './cal-loader';

const SCRIPT_TIMEOUT_MS = 10_000;

/** Mounts initialised this page-load; new nodes (post-swap) are re-initialised. */
const initedMounts = new WeakSet<HTMLElement>();

export function initCalEmbed() {
  const root = document.querySelector<HTMLElement>('.cal-embed-widget');
  if (!root) return;

  const frame = root.querySelector<HTMLElement>('.cal-frame');
  const escapeBar = root.querySelector<HTMLElement>('.cal-escape');
  const escapeLink = root.querySelector<HTMLAnchorElement>('.cal-escape__link');
  const mount = root.querySelector<HTMLElement>('.cal-embed');
  const fallback = root.querySelector<HTMLElement>('.cal-fallback');
  const status = root.querySelector<HTMLElement>('.cal-status');

  // No Cal link configured: fallback card is already visible server-side
  // (DEV warning lives in CalEmbed.astro). Never load embed.js with an empty link.
  if (!mount || !CAL.link) return;

  let disposed = false;
  let calReady = false;
  let settledAt = 0;
  let routeScrollTimer: ReturnType<typeof setTimeout> | undefined;
  let focusFormTimer: ReturnType<typeof setTimeout> | undefined;

  const ensureIframeTitle = () => {
    const ifr = mount.querySelector<HTMLIFrameElement>('iframe');
    if (ifr && !ifr.title) {
      ifr.title = 'Schedule a meeting with Decbricks';
    }
  };

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
    if (escapeBar) {
      escapeBar.classList.add('is-hidden');
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
    if (escapeBar) {
      escapeBar.classList.remove('is-hidden');
    }
    mount.classList.remove('is-hidden');
    mount.style.display = '';
    mount.setAttribute('aria-busy', ready ? 'false' : 'true');
    mount.setAttribute('aria-hidden', 'false');
    fallback?.classList.add('is-hidden');
    ensureIframeTitle();
  };

  const smoothScrollY = (targetY: number, onDone?: () => void) => {
    const y = Math.max(0, Math.round(targetY));
    const lenis = getLenis();
    if (prefersReducedMotion) {
      if (lenis) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo({ top: y, behavior: 'auto' });
      onDone?.();
      return;
    }
    if (lenis) {
      lenis.scrollTo(y, { duration: 0.45 });
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    if (onDone) {
      focusFormTimer = setTimeout(() => {
        if (!disposed) onDone();
      }, 480);
    }
  };

  const onEscapeClick = (e: MouseEvent) => {
    const formTarget =
      document.querySelector<HTMLElement>('#contact .sections-contactForm__form') ??
      document.querySelector<HTMLElement>('#contact');
    if (!formTarget) return;
    e.preventDefault();
    const targetY = window.scrollY + formTarget.getBoundingClientRect().top - 84;
    smoothScrollY(targetY, () => {
      const firstInput =
        formTarget.querySelector<HTMLElement>('#email') ??
        formTarget.querySelector<HTMLElement>('input:not([type="hidden"]), textarea');
      firstInput?.focus({ preventScroll: true });
    });
  };
  escapeLink?.addEventListener('click', onEscapeClick);

  let sanity: ReturnType<typeof setTimeout> | undefined;
  let calObj: CalQueueObject | undefined;

  const markReady = () => {
    if (!calReady) {
      calReady = true;
      settledAt = performance.now();
    }
    ensureIframeTitle();
  };

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

  const onLinkReady = () => {
    if (disposed) return;
    markReady();
  };

  const onRouteChanged = () => {
    if (disposed || !calReady) return;
    // Ignore Cal's initial route sync right after mounting.
    if (performance.now() - settledAt < 1200) return;
    if (!window.matchMedia('(max-width: 1023px)').matches) return;

    if (routeScrollTimer) clearTimeout(routeScrollTimer);
    // Wait ~620ms so Cal's own ~550ms mobile auto-scroll settles first, then
    // ensure the date heading ("Day Nth | 12h 24h") sits cleanly below our 62px bar.
    routeScrollTimer = setTimeout(() => {
      if (disposed || !window.matchMedia('(max-width: 1023px)').matches) return;
      const mountRect = mount.getBoundingClientRect();
      // Skip on Step 2 (compact details form ~600–850px) where slots are gone.
      if (mountRect.height < 1050) return;

      // Empirically measured toggleTop ("12h | 24h" row) across 292–740px Cal widths.
      const slotsHeadingOffset = Math.round(mountRect.width * 0.858 + 356);
      if (slotsHeadingOffset >= mountRect.height - 120) return;

      const slotsHeadingViewportY = mountRect.top + slotsHeadingOffset;
      if (slotsHeadingViewportY >= 78 && slotsHeadingViewportY <= window.innerHeight * 0.65) {
        return;
      }

      const targetDocY = window.scrollY + slotsHeadingViewportY - 84;
      smoothScrollY(targetDocY);
    }, 620);
  };

  const onDimensionChanged = (e: unknown) => {
    if (disposed) return;
    ensureIframeTitle();
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
    markReady();
    if (sanity) {
      clearTimeout(sanity);
      sanity = undefined;
    }
  };

  const initInline = (): boolean => {
    if (initedMounts.has(mount)) return false;
    initedMounts.add(mount);
    const cal = getCalNamespace(CAL.namespace, CAL.origin);
    calObj = cal;
    try {
      cal('inline', {
        elementOrSelector: mount,
        calLink: CAL.link,
        layout: 'month_view',
      });
      cal('on', { action: 'bookingSuccessful', callback: onBookingSuccess });
      cal('on', { action: 'linkFailed', callback: onLinkFailed });
      cal('on', { action: 'linkReady', callback: onLinkReady });
      cal('on', { action: '__routeChanged', callback: onRouteChanged });
      cal('on', { action: '__dimensionChanged', callback: onDimensionChanged });
    } catch {
      showFallback('The booking calendar could not load. Use the contact options above, or send the form below.');
      return true; // gave up; do not retry within this page life
    }
    // Sanity check: if embed.js never materialises (script error, blocked
    // network), swap to the fallback instead of showing a perpetual skeleton.
    sanity = setTimeout(() => {
      if (disposed) return;
      const calReadyFlag = window.Cal?.loaded && !window.Cal?.scriptFailed;
      if (calReadyFlag && mount.querySelector('iframe')) {
        revealEmbed(true);
        markReady();
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
    if (routeScrollTimer) clearTimeout(routeScrollTimer);
    if (focusFormTimer) clearTimeout(focusFormTimer);
    escapeLink?.removeEventListener('click', onEscapeClick);
    bus.off('cookies-decided', onCookiesDecided);
    if (calObj) {
      try {
        calObj('off', { action: 'bookingSuccessful', callback: onBookingSuccess });
        calObj('off', { action: 'linkFailed', callback: onLinkFailed });
        calObj('off', { action: 'linkReady', callback: onLinkReady });
        calObj('off', { action: '__routeChanged', callback: onRouteChanged });
        calObj('off', { action: '__dimensionChanged', callback: onDimensionChanged });
      } catch {
        // embed.js may still be loading; `disposed` flag guards any late call.
      }
    }
  };
}
