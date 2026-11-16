import { bp } from './core/gsap';
import { shouldPreloadDistortion } from './webgl/capability';

/**
 * Attaches the preview `<source>` defensively so mobile/desktop video variants
 * stay mutually exclusive while ensuring `readyState >= 2` decodes fast on active viewports.
 */
export function ensurePreviewVideoSource(
  v: HTMLVideoElement,
  preloadOverride?: 'auto' | 'metadata'
): boolean {
  const src = v.dataset.previewMp4;
  if (!src) return false;
  const targetPreload =
    preloadOverride ?? (shouldPreloadDistortion() ? 'auto' : 'metadata');
  const existing = v.querySelector('source');
  if (existing) {
    if (v.preload !== targetPreload && targetPreload === 'auto') {
      v.preload = 'auto';
    }
    return false;
  }
  v.muted = true;
  v.defaultMuted = true;
  v.preload = targetPreload;
  const s = document.createElement('source');
  s.src = src;
  s.type = 'video/mp4';
  v.appendChild(s);
  v.load();
  v.play().catch(() => {});
  return true;
}

/**
 * Resolves `true` once a `<video>` has at least one decoded frame (`readyState >= 2`
 * and non-zero intrinsic dimensions), or `false` on error / abort / timeout.
 */
export function waitForVideoFirstFrame(
  v: HTMLVideoElement,
  opts: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<boolean> {
  if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
    return Promise.resolve(true);
  }
  if (opts.signal?.aborted) return Promise.resolve(false);

  return new Promise((resolve) => {
    let done = false;
    let timer = 0;

    const cleanup = () => {
      if (timer) window.clearTimeout(timer);
      v.removeEventListener('loadeddata', checkReady);
      v.removeEventListener('canplay', checkReady);
      v.removeEventListener('loadedmetadata', checkReady);
      v.removeEventListener('error', onFail);
      opts.signal?.removeEventListener('abort', onFail);
    };

    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(ok);
    };

    const checkReady = () => {
      if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
        finish(true);
      }
    };

    const onFail = () => finish(false);

    v.addEventListener('loadeddata', checkReady);
    v.addEventListener('canplay', checkReady);
    v.addEventListener('loadedmetadata', checkReady);
    v.addEventListener('error', onFail);
    opts.signal?.addEventListener('abort', onFail, { once: true });

    if (opts.timeoutMs && opts.timeoutMs > 0) {
      timer = window.setTimeout(() => {
        finish(v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0);
      }, opts.timeoutMs);
    }
  });
}

/**
 * Keeps only the matching viewport preview video (`desktop` vs `mobile`) loaded
 * and pauses playback while scrolled offscreen.
 */
export function initPreviewVideos() {
  let io: IntersectionObserver | null = null;
  let rafId = 0;

  const ensureIo = () => {
    if (io) return io;
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && !document.hidden) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: '100px' }
    );
    return io;
  };

  const sync = () => {
    const desktop = window.innerWidth >= bp.lg;
    document
      .querySelectorAll<HTMLVideoElement>('video[data-preview-mp4]')
      .forEach((v) => {
        const isMobileVariant = v.classList.contains(
          'sections-hero__videoPreviewMobile'
        );
        const active = isMobileVariant ? !desktop : desktop;
        const has = v.querySelector('source');
        if (active && !has) {
          ensurePreviewVideoSource(v);
          ensureIo().observe(v);
        } else if (!active && has) {
          has.remove();
          v.load();
          io?.unobserve(v);
        }
      });
  };

  sync();

  const onResize = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      sync();
    });
  };
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    io?.disconnect();
    window.removeEventListener('resize', onResize);
  };
}
