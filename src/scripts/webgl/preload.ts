import { ensurePreviewVideoSource, waitForVideoFirstFrame } from '../media';
import { shouldPreloadDistortion } from './capability';
import { initWebGL } from './experience';

function runInIdleSlice(fn: () => Promise<void> | void, fallbackDelayMs = 16): Promise<void> {
  return new Promise((resolve) => {
    const exec = () => {
      Promise.resolve(fn()).finally(resolve);
    };
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
      }
    ).requestIdleCallback;
    if (typeof ric === 'function') {
      ric(exec, { timeout: 250 });
    } else {
      window.setTimeout(exec, fallbackDelayMs);
    }
  });
}

function preloadCaseStudyCardImages(timeoutMs: number): Promise<void> {
  const imgs = Array.from(
    document.querySelectorAll<HTMLImageElement>(
      '.sections-caseStudies .parts-caseStudySlider__slide img.parts-caseStudyCard__image'
    )
  ).slice(0, 6);

  if (!imgs.length) return Promise.resolve();

  const tasks = imgs.map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.loading === 'lazy') img.loading = 'eager';
        const onDone = () => {
          if (typeof img.decode === 'function' && img.naturalWidth > 0) {
            img.decode().catch(() => {}).finally(resolve);
          } else {
            resolve();
          }
        };
        if (img.complete && img.naturalWidth > 0) {
          onDone();
          return;
        }
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      })
  );

  return new Promise((resolve) => {
    const t = window.setTimeout(resolve, timeoutMs);
    Promise.allSettled(tasks).finally(() => {
      window.clearTimeout(t);
      resolve();
    });
  });
}

/**
 * Preloads and GPU-warms desktop distortion assets during the intro gate
 * without blocking beyond `timeoutMs` or adding any network cost on
 * touch devices, `<1024px` viewports, `prefers-reduced-motion`, or `saveData`.
 */
export function preloadDistortionForIntro(
  opts: { timeoutMs?: number } = {}
): Promise<void> {
  if (!shouldPreloadDistortion()) return Promise.resolve();
  const capMs = opts.timeoutMs ?? 2400;

  const webglAndWarmup = initWebGL().then((exp) => {
    if (!exp) return;
    return runInIdleSlice(() => exp.warmupGPU());
  });

  const startVideo = document.querySelector<HTMLVideoElement>(
    '.sections-hero__videoPreview.start'
  );
  const videoTask = startVideo
    ? (() => {
        ensurePreviewVideoSource(startVideo, 'auto');
        return waitForVideoFirstFrame(startVideo, { timeoutMs: capMs }).then(() => undefined);
      })()
    : Promise.resolve();

  const cardsTask = preloadCaseStudyCardImages(capMs);

  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, capMs);
    Promise.allSettled([webglAndWarmup, videoTask, cardsTask]).finally(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
}
