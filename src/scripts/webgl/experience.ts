/**
 * experience.ts — capability-gated async facade over `impl.ts`.
 *
 * Touch devices, `< 1024px` viewports, and `prefers-reduced-motion` users
 * never download the Three.js `impl` bundle. Desktop fine-pointer sessions
 * receive a single shared experience with explicit init/resume/suspend/fallback
 * notifications so consumers never drop out due to a cold-load race.
 */
import { bus } from '../core/gsap';
import { canUseDistortion, onDistortionCapabilityChange } from './capability';
import type { WebGLExperienceAPI } from './impl';

export type { WebGLImage, WebGLImageOptions, WebGLTrail, WebGLTrailOptions, WebGLExperienceAPI } from './impl';

let experienceInstance: WebGLExperienceAPI | null | undefined = undefined;
let initPromise: Promise<WebGLExperienceAPI | null> | null = null;
let stopCapabilityWatch: (() => void) | null = null;

const readyCallbacks = new Set<(exp: WebGLExperienceAPI | null) => void>();

let pageHeroTransitionStarted = false;
let pageHeroEntranceCompleted = false;

bus.on('transition-entrance-start', () => {
  pageHeroTransitionStarted = false;
  pageHeroEntranceCompleted = false;
});
bus.on('hero-transition-start', () => {
  pageHeroTransitionStarted = true;
});
bus.on('hero-entrance-complete', () => {
  pageHeroEntranceCompleted = true;
});

export function resetHeroLifecycleState() {
  pageHeroTransitionStarted = false;
  pageHeroEntranceCompleted = false;
}

export function getWebGLExperience(): WebGLExperienceAPI | null {
  return experienceInstance ?? null;
}

function flushReadyCallbacks(exp: WebGLExperienceAPI | null) {
  if (!readyCallbacks.size) return;
  const pending = [...readyCallbacks];
  readyCallbacks.clear();
  pending.forEach((cb) => cb(exp));
}

function ensureCapabilityWatcher() {
  if (stopCapabilityWatch || typeof window === 'undefined') return;
  stopCapabilityWatch = onDistortionCapabilityChange((enabled) => {
    if (enabled) {
      void initWebGL();
    } else {
      experienceInstance?.suspend();
    }
  });
}

/**
 * Registers a one-shot callback invoked as soon as WebGL initialization settles
 * with either the live `WebGLExperienceAPI` or `null` (fallback).
 */
export function whenWebGLReady(cb: (exp: WebGLExperienceAPI | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  ensureCapabilityWatcher();

  if (!canUseDistortion() || experienceInstance === null) {
    queueMicrotask(() => cb(null));
    return () => {};
  }
  if (experienceInstance) {
    experienceInstance.resume();
    queueMicrotask(() => {
      if (canUseDistortion() && experienceInstance) cb(experienceInstance);
      else cb(null);
    });
    return () => {};
  }

  readyCallbacks.add(cb);
  void initWebGL();
  return () => {
    readyCallbacks.delete(cb);
  };
}

/** Idempotently loads and initializes the Three.js distortion engine when allowed. */
export function initWebGL(): Promise<WebGLExperienceAPI | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  ensureCapabilityWatcher();

  if (!canUseDistortion()) {
    experienceInstance?.suspend();
    return Promise.resolve(null);
  }
  if (experienceInstance) {
    experienceInstance.resume();
    flushReadyCallbacks(experienceInstance);
    return Promise.resolve(experienceInstance);
  }
  if (experienceInstance === null) {
    flushReadyCallbacks(null);
    return Promise.resolve(null);
  }
  if (initPromise) return initPromise;

  initPromise = import('./impl')
    .then(({ createExperience }) => {
      if (!canUseDistortion()) {
        flushReadyCallbacks(null);
        return null;
      }
      const exp = createExperience();
      if (!exp) {
        experienceInstance = null;
        flushReadyCallbacks(null);
        return null;
      }
      experienceInstance = exp;
      exp.reattachCanvases();
      exp.rebuildPageTargets();
      if (pageHeroEntranceCompleted) {
        exp.notifyHeroEntranceComplete();
      } else if (pageHeroTransitionStarted) {
        exp.notifyHeroTransitionStart();
      }
      flushReadyCallbacks(exp);
      window.dispatchEvent(new CustomEvent('threeJS-ready'));
      return exp;
    })
    .catch((err) => {
      experienceInstance = null;
      flushReadyCallbacks(null);
      if (import.meta.env.DEV) {
        console.warn('Decbricks: WebGL chunk failed to load (page keeps DOM fallbacks):', err);
      }
      return null;
    })
    .finally(() => {
      initPromise = null;
    });

  return initPromise;
}
