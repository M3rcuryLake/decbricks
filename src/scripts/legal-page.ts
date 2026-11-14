/**
 * Legal page (/terms, unified Terms of Service + Privacy Policy) motion.
 *
 * Owns everything animated on /terms outside the hero (the hero's motion
 * belongs to the shared ServicesHero via initServicesPage):
 *  - individual clauses + Privacy Policy heading fade-rise reveal,
 *  - the reading-progress hairline (fixed, scaleX = scroll fraction),
 *  - the back-to-top button visibility and smooth scroll.
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

export function initLegalPage(): () => void {
  const page = document.querySelector<HTMLElement>('.page-legal');
  if (!page) return () => {};

  const reduce = prefersReducedMotion();
  const bar = page.querySelector<HTMLElement>('.legal-progress');
  const topBtn = page.querySelector<HTMLButtonElement>('.legal-top');
  const revealTargets = Array.from(
    page.querySelectorAll<HTMLElement>('.legal-clause, .legal-privacyTitle')
  );

  const teardowns: Array<() => void> = [];
  const lenis = (
    window as unknown as { $lenis?: { scrollTo: (t: number | HTMLElement, o?: object) => void } }
  ).$lenis;

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

  /* ---------- back-to-top click ---------- */
  const onTopClick = () => {
    if (lenis) lenis.scrollTo(0, { duration: reduce ? 0 : 1 });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
  topBtn?.addEventListener('click', onTopClick);
  if (topBtn) teardowns.push(() => topBtn.removeEventListener('click', onTopClick));

  /* ---------- entrances (skipped entirely under reduced motion) ---------- */
  if (!reduce && revealTargets.length) {
    const ctx = gsap.context(() => {
      const hashId = window.location.hash.replace(/^#/, '');
      const hashEl = hashId ? document.getElementById(hashId) : null;
      // Keep any hash-targeted section/heading and everything at or above the
      // fold immediately visible so deep links like /terms#privacy-policy never
      // flash hidden before the IntersectionObserver settles.
      const toAnimate = revealTargets.filter((el) => {
        if (hashEl && (el === hashEl || hashEl.contains(el) || el.contains(hashEl))) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= window.innerHeight;
      });

      if (!toAnimate.length) return;

      gsap.set(toAnimate, { autoAlpha: 0, y: 24 });
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            gsap.to(entry.target, {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              overwrite: true,
            });
            io.unobserve(entry.target);
          }
        },
        { rootMargin: '0px 0px -12% 0px' }
      );
      toAnimate.forEach((el) => io.observe(el));
      teardowns.push(() => {
        io.disconnect();
        // Restore rest state so a swap teardown never leaves content hidden.
        gsap.set(toAnimate, { clearProps: 'all' });
      });
    }, page);
    teardowns.push(() => ctx.revert());
  }

  return () => teardowns.forEach((t) => t());
}
