import { bp } from './core/gsap';

/**
 * The original renders the preview <source> client-side, only for the video whose
 * variant matches the viewport (desktop vs mobile). Same behaviour here.
 */
export function initPreviewVideos() {
  let io: IntersectionObserver | null = null;
  const sync = () => {
    const desktop = window.innerWidth >= bp.lg;
    document.querySelectorAll<HTMLVideoElement>('video[data-preview-mp4]').forEach((v) => {
      const isMobileVariant = v.classList.contains('sections-hero__videoPreviewMobile');
      const active = isMobileVariant ? !desktop : desktop;
      const has = v.querySelector('source');
      if (active && !has) {
        // Attach <source> immediately for the active viewport preview variant so
        // the hero preview decodes frame 0 right away instead of waiting on IO.
        // Force muted defensively so tracks with audio still satisfy autoplay rules.
        v.muted = true;
        v.defaultMuted = true;
        const s = document.createElement('source');
        s.src = v.dataset.previewMp4!;
        s.type = 'video/mp4';
        v.appendChild(s);
        v.load();
        v.play().catch(() => {});
        if (!io) {
          io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              const video = entry.target as HTMLVideoElement;
              if (entry.isIntersecting) {
                video.play().catch(() => {});
              } else {
                video.pause();
              }
            });
          }, { rootMargin: '100px' });
        }
        io.observe(v);
      } else if (!active && has) {
        has.remove();
        v.load();
        io?.unobserve(v);
      }
    });
  };
  sync();
  let t: number;
  const onResize = () => {
    clearTimeout(t);
    t = window.setTimeout(sync, 200);
  };
  window.addEventListener('resize', onResize);

  return () => {
    io?.disconnect();
    window.removeEventListener('resize', onResize);
    window.clearTimeout(t);
  };
}
