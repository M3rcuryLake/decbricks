/**
 * experience.ts — thin facade over the three.js WebGL experience (§7 perf).
 *
 * The heavy implementation lives in `impl.ts` (imports `three`) and is loaded
 * with a dynamic `import()` from `initWebGL()`, so three.js is not in the
 * render-blocking main bundle. Consumers (hero, services-page, case-studies)
 * only talk to the facade; the template already null-guards
 * `getWebGLExperience()` and falls back to non-WebGL behaviour until ready.
 */
import { bp, bus } from '../core/gsap';
import type { WebGLExperienceAPI } from './impl';

export type { WebGLImage, WebGLImageOptions, WebGLTrail, WebGLTrailOptions, WebGLExperienceAPI } from './impl';

let experienceInstance: WebGLExperienceAPI | null | undefined = undefined;
const readyCallbacks = new Set<(exp: WebGLExperienceAPI) => void>();

// Track the active page's hero lifecycle events from initial boot so if the
// lazy three.js chunk finishes loading after reload/loader already emitted
// `hero-transition-start` or `hero-entrance-complete`, hero flares still fire.
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

export function whenWebGLReady(cb: (exp: WebGLExperienceAPI) => void): () => void {
  if (typeof window === 'undefined' || window.innerWidth < bp.lg) return () => {};
  if (experienceInstance) {
    cb(experienceInstance);
    return () => {};
  }
  if (experienceInstance === null) return () => {};
  readyCallbacks.add(cb);
  return () => {
    readyCallbacks.delete(cb);
  };
}

export function initWebGL() {
  if (window.innerWidth < bp.lg) return;
  if (experienceInstance !== undefined) return experienceInstance;
  // Kick the chunk load in parallel with the loader intro (non-blocking).
  import('./impl')
    .then(({ createExperience }) => {
      const exp = createExperience();
      if (!exp) {
        experienceInstance = null;
        readyCallbacks.clear();
        return;
      }
      experienceInstance = exp;
      // A page swap may have happened while the chunk loaded — re-bind the
      // renderers to the current canvases, then sync targets.
      exp.reattachCanvases();
      exp.rebuildPageTargets();
      if (pageHeroEntranceCompleted) {
        exp.notifyHeroEntranceComplete();
      } else if (pageHeroTransitionStarted) {
        exp.notifyHeroTransitionStart();
      }
      [...readyCallbacks].forEach((cb) => cb(exp));
      readyCallbacks.clear();
      window.dispatchEvent(new CustomEvent('threeJS-ready'));
    })
    .catch((err) => {
      experienceInstance = null;
      readyCallbacks.clear();
      console.warn('Decbricks: WebGL chunk failed to load (page keeps CSS fallbacks):', err);
    });
}
