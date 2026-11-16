import { bp, prefersReducedMotion } from '../core/gsap';

export type DistortionState = 'pending' | 'ready' | 'fallback';

const FINE_HOVER_MQ = '(hover: hover) and (pointer: fine)';
const DESKTOP_MQ = `(min-width: ${bp.lg}px)`;
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';

/**
 * Distortion only activates on desktop viewports (>= 1024px) with a fine
 * hover-capable pointer and without `prefers-reduced-motion`.
 */
export function canUseDistortion(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth < bp.lg) return false;
  if (prefersReducedMotion()) return false;
  return window.matchMedia(FINE_HOVER_MQ).matches;
}

/**
 * Checks whether GPU distortion preloading should run during the intro loader.
 * Honours Data-Saver in addition to capability constraints.
 */
export function shouldPreloadDistortion(): boolean {
  if (!canUseDistortion()) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData;
}

/** Sets the deterministic readiness attribute inspected by tests and styles. */
export function setDistortionState(
  el: Element | null | undefined,
  state: DistortionState
): void {
  if (!el) return;
  el.setAttribute('data-distortion', state);
}

/**
 * Watches desktop breakpoint, fine-pointer capability, and reduced-motion changes.
 * Fires `onChange` only when the effective boolean capability actually flips.
 */
export function onDistortionCapabilityChange(
  onChange: (enabled: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let last = canUseDistortion();
  let rafId = 0;

  const scheduleCheck = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      const next = canUseDistortion();
      if (next !== last) {
        last = next;
        onChange(next);
      }
    });
  };

  const mqs = [DESKTOP_MQ, FINE_HOVER_MQ, REDUCED_MOTION_MQ].map((q) =>
    window.matchMedia(q)
  );
  mqs.forEach((mq) => mq.addEventListener('change', scheduleCheck));
  window.addEventListener('resize', scheduleCheck, { passive: true });

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    mqs.forEach((mq) => mq.removeEventListener('change', scheduleCheck));
    window.removeEventListener('resize', scheduleCheck);
  };
}
