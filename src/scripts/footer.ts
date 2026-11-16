import { bus, ScrollTrigger, initSvgRectReveal, prefersReducedMotion } from './core/gsap';
import { getLenis } from './smooth-scroll';

let didWarnMissing = false;

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below when clipboard permission is unavailable
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    const execFn = (document as unknown as Record<string, ((commandId: string) => boolean) | undefined>)['execCommand'];
    const ok = typeof execFn === 'function' ? execFn.call(document, 'copy') : false;
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Footer lifecycle (Phases 1–4):
 * - Brick-laid wordmark IntersectionObserver adds `.is-built` once and disconnects.
 * - Click-to-copy email with aria-live status confirmation.
 * - Quantised 6-brick scroll-progress gauge on `.parts-btnScrollTop`.
 * - Full listener / observer / ScrollTrigger teardown across client swaps.
 */
export function initFooter() {
  const footer = document.querySelector<HTMLElement>('.structure-footer');
  if (!footer) return;

  if (import.meta.env.DEV && !didWarnMissing && footer.dataset.devMissing) {
    didWarnMissing = true;
    for (const item of footer.dataset.devMissing.split('|')) {
      console.warn(`Decbricks footer: missing ${item} — section/link hidden.`);
    }
  }

  initSvgRectReveal(footer);

  const wordmarkRow = footer.querySelector<HTMLElement>('.structure-footer__wordmarkRow');
  const scrollTopBtn = footer.querySelector<HTMLButtonElement>('.parts-btnScrollTop');
  const manageCookiesBtn = footer.querySelector<HTMLButtonElement>('button[aria-label="Manage Cookies"]');
  const copyBtn = footer.querySelector<HTMLButtonElement>('[data-copy-email]');
  const copyStatus = footer.querySelector<HTMLElement>('[data-copy-status]');
  const bricksWrap = footer.querySelector<HTMLElement>('[data-footer-bricks]');
  const brickEls = bricksWrap
    ? Array.from(bricksWrap.querySelectorAll<HTMLElement>('[data-brick]'))
    : [];
  let disposed = false;

  // 1. Wordmark brick-laying observer
  let layObserver: IntersectionObserver | null = null;
  if (wordmarkRow) {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      wordmarkRow.classList.add('is-built');
    } else {
      layObserver = new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              wordmarkRow.classList.add('is-built');
              observer.disconnect();
              layObserver = null;
              break;
            }
          }
        },
        { threshold: 0.2 }
      );
      layObserver.observe(wordmarkRow);
    }
  }

  // 2. Quantised 6-brick scroll-progress gauge on Rise to the top
  let lastFilled = -1;
  const applyBrickProgress = (progress: number) => {
    if (!brickEls.length) return;
    const p = window.scrollY <= 2 ? 0 : Math.min(1, Math.max(0, progress));
    const filled = p <= 0.02 ? 0 : p >= 0.985 ? 6 : Math.min(5, Math.max(1, Math.round(p * 6)));
    if (filled === lastFilled) return;
    lastFilled = filled;
    for (const el of brickEls) {
      const idx = Number(el.dataset.brick || 0);
      el.classList.toggle('is-filled', idx > 0 && idx <= filled);
    }
  };

  let progressTrigger: ScrollTrigger | null = null;
  if (brickEls.length) {
    progressTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      invalidateOnRefresh: true,
      onUpdate: (self) => applyBrickProgress(self.progress),
    });
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    applyBrickProgress(maxY > 0 ? window.scrollY / maxY : 0);
  }

  // 3. Copy-email action with aria-live status
  let copyTimer: number | null = null;
  const clearCopyTimer = () => {
    if (copyTimer !== null) {
      window.clearTimeout(copyTimer);
      copyTimer = null;
    }
  };
  const onCopyEmail = async () => {
    const addr = copyBtn?.dataset.copyEmail;
    if (!copyBtn || !addr) return;
    const ok = await copyText(addr);
    if (disposed) return;
    clearCopyTimer();
    if (ok) {
      copyBtn.dataset.copied = 'true';
      copyBtn.textContent = 'Copied';
      if (copyStatus) copyStatus.textContent = 'Email copied';
    } else {
      delete copyBtn.dataset.copied;
      if (copyStatus) copyStatus.textContent = 'Copy failed – select the address';
    }
    copyTimer = window.setTimeout(() => {
      if (disposed) return;
      if (copyBtn) {
        delete copyBtn.dataset.copied;
        copyBtn.textContent = 'Copy';
      }
      if (copyStatus) copyStatus.textContent = '';
      copyTimer = null;
    }, 2600);
  };
  copyBtn?.addEventListener('click', onCopyEmail);

  // 4. Scroll-to-top & Manage Cookies actions
  const onScrollTop = () => {
    const reduced = prefersReducedMotion();
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, reduced ? { immediate: true } : { duration: 0.55 });
    } else {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
  };
  const onManageCookies = () => {
    bus.emit('manage-cookies');
  };

  scrollTopBtn?.addEventListener('click', onScrollTop);
  manageCookiesBtn?.addEventListener('click', onManageCookies);

  return () => {
    disposed = true;
    layObserver?.disconnect();
    layObserver = null;
    clearCopyTimer();
    copyBtn?.removeEventListener('click', onCopyEmail);
    progressTrigger?.kill();
    progressTrigger = null;
    scrollTopBtn?.removeEventListener('click', onScrollTop);
    manageCookiesBtn?.removeEventListener('click', onManageCookies);
  };
}
