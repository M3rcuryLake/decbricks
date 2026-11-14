/**
 * Legal pages (/terms, /privacy-policy) motion.
 *
 * Owns everything animated on the legal pages outside the hero (the hero's
 * motion belongs to the shared ServicesHero via initServicesPage):
 *  - the island sections' fade-rise reveal,
 *  - the reading-progress hairline (fixed, scaleX = scroll fraction),
 *  - the numbered rail's scroll-spy (aria-current via IntersectionObserver),
 *  - Lenis-aware rail jumps (fixed-header offset) and the back-to-top button.
 *
 * Lifecycle: initLegalPage() is registered in main.ts boot AND onAfterSwap;
 * it null-guards on every other page and returns a teardown that removes
 * listeners, disconnects the IO and reverts its gsap.context. No
 * ScrollTriggers survive a swap: the reveal uses a one-shot IntersectionObserver
 * instead, because page-transition.ts bulk-kills all ScrollTriggers on swap.
 * No-JS / prefers-reduced-motion readers see everything at rest: CSS defaults
 * are fully visible and this module skips every animation when motion is reduced.
 */
import { gsap, prefersReducedMotion } from './core/gsap';

/** Fixed offset clearing the fixed header for rail jumps. */
const HEADER_OFFSET = 90;

export function initLegalPage(): () => void {
  const page = document.querySelector<HTMLElement>('.page-legal');
  if (!page) return () => {};

  const reduce = prefersReducedMotion();
  const bar = page.querySelector<HTMLElement>('.legal-progress');
  const topBtn = document.querySelector<HTMLButtonElement>('.legal-top');
  const rail = document.querySelector<HTMLElement>('.legal-rail');
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.legal-island section'));
  const railLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.legal-railLink'));

  const teardowns: Array<() => void> = [];
  const lenis = (window as unknown as { $lenis?: { scrollTo: (t: number | HTMLElement, o?: object) => void } }).$lenis;

  /* ---------- progress hairline + back-to-top visibility ---------- */
  const updateScrollUI = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    if (bar && max > 0) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, y / max))})`;
    if (topBtn) {
      if (y > window.innerHeight) topBtn.removeAttribute('hidden');
      else topBtn.setAttribute('hidden', '');
    }
  };
  const onScroll = () => updateScrollUI();
  window.addEventListener('scroll', onScroll, { passive: true });
  updateScrollUI();
  teardowns.push(() => window.removeEventListener('scroll', onScroll));

  /* ---------- scroll-spy ---------- */
  let currentLink: HTMLAnchorElement | null = null;
  if (rail && sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const link = railLinks.find((l) => l.getAttribute('href') === `#${entry.target.id}`);
          if (!link || link === currentLink) continue;
          currentLink?.removeAttribute('aria-current');
          link.setAttribute('aria-current', 'true');
          currentLink = link;
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((s) => spy.observe(s));
    teardowns.push(() => spy.disconnect());
  }

  /* ---------- rail clicks: smooth, header-aware jumps ---------- */
  const onRailClick = (e: Event) => {
    const link = (e.target as HTMLElement).closest?.('a.legal-railLink') as HTMLAnchorElement | null;
    if (!link) return;
    const target = document.getElementById((link.getAttribute('href') || '').slice(1));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: reduce ? 0 : 1 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href') || location.pathname);
  };
  rail?.addEventListener('click', onRailClick);
  if (rail) teardowns.push(() => rail.removeEventListener('click', onRailClick));

  /* ---------- back-to-top click ---------- */
  const onTopClick = () => {
    if (lenis) lenis.scrollTo(0, { duration: reduce ? 0 : 1 });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
  topBtn?.addEventListener('click', onTopClick);
  if (topBtn) teardowns.push(() => topBtn.removeEventListener('click', onTopClick));

  /* ---------- entrances (skipped entirely under reduced motion) ---------- */
  if (!reduce) {
    const ctx = gsap.context(() => {
      const island = document.querySelector('.legal-island');
      if (island) {
        // One-shot reveal via IO: page-transition.ts bulk-kills ScrollTriggers
        // on every client-side swap, so ST-owned tweens would die mid-flight.
        gsap.set(sections, { autoAlpha: 0, y: 24 });
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              gsap.to(entry.target, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', overwrite: true });
              io.unobserve(entry.target);
            }
          },
          { rootMargin: '0px 0px -12% 0px' },
        );
        sections.forEach((s) => io.observe(s));
        teardowns.push(() => {
          io.disconnect();
          // Restore rest state so a swap teardown never leaves content hidden.
          gsap.set(sections, { clearProps: 'all' });
        });
      }
    }, page);
    teardowns.push(() => ctx.revert());
  }

  return () => teardowns.forEach((t) => t());
}
