import type * as THREE from 'three';
import {
  gsap,
  ScrollTrigger,
  SplitText,
  Draggable,
  bp,
  prefersReducedMotion,
  resizeManager,
  initSvgRectReveal,
} from './core/gsap';
import { MomentumHover } from './core/momentum-hover';
import { horizontalLoop } from './core/horizontal-loop';
import { canUseDistortion, onDistortionCapabilityChange, setDistortionState } from './webgl/capability';
import { whenWebGLReady, type WebGLExperienceAPI, type WebGLImage } from './webgl/experience';

class StickerMouseTrail {
  private increment = 0;
  private oldIncrement = { x: 0, y: 0 };
  private imageIndex = 0;
  private moveThrottle = 32;
  private lastMoveTime = 0;
  private config = {
    resetMultipler: 6,
    startScale: 0.5,
    entranceEasing: 'slowDown',
    entranceDuration: 0.2,
    exitEasing: 'power2.out',
    exitDuration: 0,
    xOffset: 80,
    yOffset: 10,
    maxRotation: 45,
    speedMultiplier: 4,
    maxTravelDistance: 20,
    travelDuration: 1.2,
    stickerLifespan: 0,
    poolSize: 32,
    burstCount: 3,
    burstStagger: 0.05,
  };
  private resetDistance = window.innerWidth / 6;
  private stickerPool: { element: HTMLElement; inUse: boolean; timeline: gsap.core.Timeline | null }[] = [];
  private activeStickers = new Set<{ element: HTMLElement; inUse: boolean; timeline: gsap.core.Timeline | null }>();
  private stickerElements: HTMLElement[] = [];
  private burstCalls: gsap.core.Tween[] = [];
  private target!: HTMLElement;
  private targetRect!: DOMRect;
  private entranceTrigger?: ScrollTrigger;
  private onMouseMove: ((e: MouseEvent) => void) | null = null;
  private onResize: (() => void) | null = null;

  constructor(private el: HTMLElement) {
    if (window.innerWidth >= bp.lg && !prefersReducedMotion()) {
      this.init();
    }
  }

  private init() {
    this.target = this.el.querySelector<HTMLElement>('.mouse-target') || this.el;
    const rawStickers = Array.from(this.el.querySelectorAll<HTMLElement>('.sticker'));
    this.stickerElements = gsap.utils.shuffle(rawStickers);
    if (!this.stickerElements.length) return;

    this.targetRect = this.target.getBoundingClientRect();
    this.resetDistance = this.targetRect.width / this.config.resetMultipler;
    this.initStickerPool();

    this.onMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
    this.target.addEventListener('mousemove', this.onMouseMove);
    this.entranceTrigger = ScrollTrigger.create({
      trigger: this.target,
      start: 'top center',
      once: true,
      onEnter: () => this.createBurst(this.config.burstCount),
    });

    this.onResize = () => {
      this.targetRect = this.target.getBoundingClientRect();
      this.resetDistance = this.targetRect.width / this.config.resetMultipler;
    };
    resizeManager.add(this.onResize);
  }

  /** Stops all listeners/triggers/pool activity; safe to call multiple times. */
  destroy() {
    if (this.onMouseMove) this.target?.removeEventListener('mousemove', this.onMouseMove);
    if (this.onResize) resizeManager.remove(this.onResize);
    this.onMouseMove = null;
    this.onResize = null;
    this.entranceTrigger?.kill();
    this.entranceTrigger = undefined;
    this.burstCalls.forEach((c) => c.kill());
    this.burstCalls = [];
    this.stickerPool.forEach((s) => s.timeline?.kill());
    gsap.killTweensOf(this.stickerPool.map((s) => s.element));
  }

  private initStickerPool() {
    for (let i = 0; i < this.config.poolSize; i++) {
      const srcEl = this.stickerElements[i % this.stickerElements.length];
      if (!srcEl) return;
      const clone = srcEl.cloneNode(true) as HTMLElement;
      clone.classList.remove('invisible', 'h-1', 'w-1', 'sticker');
      clone.classList.add('active-sticker', 'absolute', 'pointer-events-none', 'top-0', 'left-0');
      gsap.set(clone, { autoAlpha: 0, scale: 0 });
      this.target.appendChild(clone);
      this.stickerPool.push({ element: clone, inUse: false, timeline: null });
    }
  }

  private createBurst(count: number) {
    const t = this.targetRect;
    const w = t.width - 120;
    const h = t.height - 120;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(Math.sqrt(count));
    const cellW = w / cols;
    const cellH = h / rows;

    for (let idx = 0; idx < count; idx++) {
      const delay = idx * this.config.burstStagger;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      this.burstCalls.push(
        gsap.delayedCall(delay, () => {
          const cx = 60 + col * cellW + cellW / 2;
          const cy = 60 + row * cellH + cellH / 2;
          const x = cx + (Math.random() - 0.5) * (cellW * 0.75);
          const y = cy + (Math.random() - 0.5) * (cellH * 0.75);
          this.createMedia(x, y, 0, 0);
        })
      );
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const now = Date.now();
    if (now - this.lastMoveTime < this.moveThrottle) return;
    this.lastMoveTime = now;
    this.targetRect = this.target.getBoundingClientRect();
    const x = e.clientX - this.targetRect.left;
    const y = e.offsetY;
    this.increment += Math.abs(x - this.oldIncrement.x) + Math.abs(y - this.oldIncrement.y);
    if (this.increment > this.resetDistance) {
      this.increment = 0;
      this.createMedia(x, y, x - this.oldIncrement.x, y - this.oldIncrement.y);
    }
    this.oldIncrement = { x, y };
  }

  private getAvailableSticker() {
    const free = this.stickerPool.find((s) => !s.inUse);
    if (free) return free;
    const oldest = this.activeStickers.values().next().value;
    if (oldest) {
      oldest.timeline?.kill();
      oldest.timeline = null;
      this.activeStickers.delete(oldest);
      oldest.inUse = false;
      return oldest;
    }
    return null;
  }

  private releaseSticker(item: { element: HTMLElement; inUse: boolean; timeline: gsap.core.Timeline | null }) {
    item.inUse = false;
    this.activeStickers.delete(item);
    gsap.set(item.element, { autoAlpha: 0, scale: 0 });
    item.timeline?.kill();
    item.timeline = null;
  }

  private createMedia(x: number, y: number, dx: number, dy: number) {
    const item = this.getAvailableSticker();
    if (!item) return;
    item.inUse = true;
    this.activeStickers.add(item);

    const el = item.element;
    const srcImg = (this.stickerElements[this.imageIndex].tagName === 'IMG'
      ? this.stickerElements[this.imageIndex]
      : this.stickerElements[this.imageIndex].querySelector('img')) as HTMLImageElement | null;
    const dstImg = (el.tagName === 'IMG' ? el : el.querySelector('img')) as HTMLImageElement | null;

    if (srcImg && dstImg) {
      dstImg.src = srcImg.src;
      dstImg.srcset = srcImg.srcset || '';
      dstImg.alt = srcImg.alt || '';
      const w = srcImg.getAttribute('width');
      const h = srcImg.getAttribute('height');
      if (w) dstImg.setAttribute('width', w);
      if (h) dstImg.setAttribute('height', h);
    }

    const tl = gsap.timeline({ onComplete: () => this.releaseSticker(item) });
    item.timeline = tl;

    gsap.set(el, {
      autoAlpha: 1,
      x,
      y,
      xPercent: -50 + (Math.random() - 0.5) * this.config.xOffset,
      yPercent: -50 + (Math.random() - 0.5) * this.config.yOffset,
      rotation: (Math.random() - 0.5) * this.config.maxRotation,
      scaleX: this.config.startScale,
      scaleY: this.config.startScale,
    });

    tl.to(el, {
      scaleX: 1,
      scaleY: 1,
      ease: this.config.entranceEasing,
      duration: this.config.entranceDuration,
    })
      .to(
        el,
        {
          x: `+=${Math.min(Math.max(dx * this.config.speedMultiplier, -this.config.maxTravelDistance), this.config.maxTravelDistance)}`,
          y: `+=${Math.min(Math.max(dy * this.config.speedMultiplier, -this.config.maxTravelDistance), this.config.maxTravelDistance)}`,
          ease: 'power4.out',
          duration: this.config.travelDuration,
        },
        '<'
      )
      .to(
        el,
        {
          duration: this.config.exitDuration,
          scale: 0,
          delay: 0.1,
          ease: this.config.exitEasing,
        },
        `>+=${this.config.stickerLifespan}`
      );

    this.imageIndex = (this.imageIndex + 1) % this.stickerElements.length;
  }
}

/**
 * Mobile sticker/logo row under "Our Work" (original: StickerSlider, only below `lg`).
 */
function initMobileStickerSlider(section: HTMLElement) {
  const root = section.querySelector<HTMLElement>('.parts-stickerSlider');
  const track = root?.querySelector<HTMLElement>('.slider');
  if (!root || !track) return;

  const mm = gsap.matchMedia();
  mm.add(`(max-width: ${bp.lg - 1}px)`, () => {
    const stickers = gsap.utils.toArray<HTMLElement>(track.querySelectorAll('.slider-sticker'));
    const images = gsap.utils.toArray<HTMLElement>(track.querySelectorAll('.slider-sticker img'));

    gsap.set(stickers, {
      rotation: () => gsap.utils.random(-12, 12),
      height: () => Math.floor(Math.random() * 46 + 75),
      minHeight: (_i: number, el: HTMLElement) => gsap.getProperty(el, 'height') as number,
      y: () => gsap.utils.random(0, 30),
      x: () => gsap.utils.random(-50, 50),
    });

    const loop = horizontalLoop(stickers, { draggable: true, repeat: -1, speed: 0.1, paused: true });
    const drift = images.length
      ? gsap
          .timeline({ repeat: -1, yoyo: true, paused: true })
          .to(images, {
            yPercent: 'random(-20,70)',
            xPercent: 'random(-50,50)',
            rotation: 'random(-10,10)',
            duration: loop.duration(),
          })
      : null;

    const play = () => {
      loop.play();
      drift?.play();
    };
    const pause = () => {
      loop.pause();
      drift?.pause();
    };
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: play,
      onEnterBack: play,
      onLeave: pause,
      onLeaveBack: pause,
    });
    if (prefersReducedMotion()) pause();

    return () => {
      st.kill();
      loop.kill();
      drift?.kill();
    };
  });

  return () => {
    mm.revert();
  };
}

function initMomentumHover(container: HTMLElement, onUpdate?: (target: HTMLElement, element: HTMLElement) => void) {
  if (prefersReducedMotion() || window.innerWidth < bp.lg) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>('.parts-caseStudySlider__slide')).map((slide) => ({
    element: slide,
    target: slide.querySelector<HTMLElement>('.parts-caseStudyCard__inner'),
  }));
  return new MomentumHover(
    container,
    items,
    {
      xyMultiplier: 10,
      rotationMultiplier: 7.5,
      inertiaResistance: 50,
      clampXY: 270,
      clampRotation: 15,
    },
    onUpdate
  );
}

export function initCaseStudies() {
  const section = document.querySelector<HTMLElement>('.sections-caseStudies');
  if (!section) return;

  const ac = new AbortController();
  initSvgRectReveal(section);
  const stickerTrail = new StickerMouseTrail(section);
  const destroyMobileStickerSlider = initMobileStickerSlider(section);

  const mm = gsap.matchMedia();
  mm.add(
    {
      isDesktop: `(min-width: ${bp.lg}px)`,
      isMobile: `(max-width: ${bp.lg - 1}px)`,
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (ctx) => {
      const { isDesktop, reduceMotion } = ctx.conditions as { isDesktop: boolean; reduceMotion: boolean };
      if (reduceMotion) return;

      const headingTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.sections-caseStudies__top',
          scrub: true,
          start: 'top bottom',
          end: 'bottom top',
        },
      });
      headingTl
        .from('.sections-caseStudies__headingLeft', { x: isDesktop ? 30 : 12, ease: 'power2.out' }, 0)
        .from('.sections-caseStudies__headingRight', { x: isDesktop ? -30 : -12, ease: 'power2.out' }, 0);

      const arrowTl = gsap
        .timeline({
          scrollTrigger: { trigger: '.svgs-wrappedArrowDown', start: 'top bottom' },
        })
        .from('.svgs-wrappedArrowDown rect', {
          autoAlpha: 0,
          stagger: { each: 0.03, from: 'random' },
          duration: 0.2,
        });

      return () => {
        headingTl.kill();
        arrowTl.kill();
      };
    }
  );

  // CaseStudySlider + WebGLCaseStudySlider + Pagination + Filtering
  const sliderEl = section.querySelector<HTMLElement>('.parts-caseStudySlider');
  if (!sliderEl) return;

  const wrapper = sliderEl.querySelector<HTMLElement>('.parts-caseStudySlider__wrapper')!;
  const pagination = sliderEl.querySelector<HTMLElement>('.parts-caseStudySlider__pagination')!;
  const paginationInner = sliderEl.querySelector<HTMLElement>('.parts-caseStudySlider__paginationInner')!;
  const paginationControl = sliderEl.querySelector<HTMLElement>('.parts-caseStudySlider__paginationControl')!;

  // Setup WebGLCaseStudySlider (matches class w in C1VH0-3n.js)
  let activeExp: WebGLExperienceAPI | null = null;
  let sliderGroup: THREE.Group | null = null;
  const webglImages = new Map<string, WebGLImage>();

  const applyDomFallbackToCards = () => {
    webglImages.forEach((wImg) => wImg.destroy());
    webglImages.clear();
    if (sliderGroup && activeExp) {
      activeExp.fgScene.remove(sliderGroup);
      sliderGroup = null;
    }
    section.querySelectorAll<HTMLElement>('.parts-caseStudyCard__image').forEach((img) => {
      img.classList.remove('lg:opacity-0');
      img.style.removeProperty('opacity');
    });
    section.querySelectorAll<HTMLElement>('.parts-caseStudyCard').forEach((card) => {
      setDistortionState(card, 'fallback');
    });
  };

  const syncSlideToWebGL = (slideEl: HTMLElement) => {
    if (!webglImages.size) return;
    const id = slideEl.getAttribute('data-case-study-id');
    if (!id) return;
    const wImg = webglImages.get(id);
    if (!wImg) return;
    const innerEl = slideEl.querySelector<HTMLElement>('.parts-caseStudyCard__inner');
    const sg = (slideEl as any)._gsap;
    const ig = (innerEl as any)?._gsap;
    const x = (parseFloat(sg?.x) || 0) + (parseFloat(ig?.x) || 0);
    const y = (parseFloat(sg?.y) || 0) + (parseFloat(ig?.y) || 0);
    const rotation = (parseFloat(sg?.rotation) || 0) + (parseFloat(ig?.rotation) || 0);
    const scaleX = (parseFloat(sg?.scaleX ?? 1) || 1) * (parseFloat(ig?.scaleX ?? 1) || 1);
    const scaleY = (parseFloat(sg?.scaleY ?? 1) || 1) * (parseFloat(ig?.scaleY ?? 1) || 1);
    const opacity = Number(gsap.getProperty(slideEl, 'opacity') ?? 1);
    wImg.updatePosition({ x, y, rotation, scaleX, scaleY, opacity }, true);
  };

  const syncAllCardsToWebGL = () => {
    if (!webglImages.size) return;
    sliderEl.querySelectorAll<HTMLElement>('.parts-caseStudySlider__slide').forEach((slide) => {
      syncSlideToWebGL(slide);
    });
  };

  let sliderDraggable: Draggable | null = null;
  let pageDraggable: Draggable | null = null;
  let pageTimeline: gsap.core.Timeline | null = null;
  let snapPositions: number[] = [0];
  let dotPitch = 0;
  let slideStep = 0;

  const getVisibleSlides = () =>
    Array.from(sliderEl.querySelectorAll<HTMLElement>('.parts-caseStudySlider__slide'));

  const getMinX = () => {
    const curX = (gsap.getProperty(wrapper, 'x') as number) || 0;
    const leftPad = wrapper.getBoundingClientRect().left * 2 - curX;
    const w = wrapper.offsetWidth;
    return Math.min(0, window.innerWidth - (leftPad + w));
  };

  const buildSnapPositions = (minX: number, slideWidth: number) => {
    slideStep = slideWidth;
    if (!slideWidth || minX >= 0) {
      slideStep = 0;
      return [0];
    }
    // Per-slide indexing like the original (aria-valuemax = slides-1, valuetext
    // "Slide N of M"). Trailing indexes clamp to the last reachable position,
    // so their x values repeat minX.
    const snaps: number[] = [];
    const count = getVisibleSlides().length;
    for (let i = 0; i < count; i++) snaps.push(Math.max(minX, -i * slideWidth));
    return snaps;
  };

  const indexFromX = (x: number) => {
    const n = snapPositions.length - 1;
    if (n < 1 || !slideStep) return 0;
    return gsap.utils.clamp(0, n, Math.round(-x / slideStep));
  };

  const xFromIndex = (idx: number) => {
    const n = snapPositions.length - 1;
    if (n < 1) return 0;
    return snapPositions[gsap.utils.clamp(0, n, Math.round(idx))];
  };

  const progressFromX = (x: number) => {
    const minX = snapPositions[snapPositions.length - 1];
    return minX < 0 ? gsap.utils.clamp(0, 1, x / minX) : 0;
  };

  // Keyboard support matching the original: ArrowRight/Left step one slide from the
  // pagination control or a slide link; Home/End jump to first/last from the
  // pagination control (verified against 1minus1.com on 2026-11-07).
  const syncSliderAria = (idx: number) => {
    const visibleCount = getVisibleSlides().length;
    const steps = Math.max(0, snapPositions.length - 1);
    paginationControl.setAttribute('aria-valuemax', String(steps));
    paginationControl.setAttribute('aria-valuenow', String(idx));
    paginationControl.setAttribute('aria-valuetext', `Slide ${idx + 1} of ${visibleCount || 1}`);
    const announcement = document.getElementById('slider-announcement');
    if (announcement) announcement.textContent = `Viewing project ${idx + 1} of ${visibleCount || 1}`;
  };

  const moveToIndex = (idx: number) => {
    const steps = snapPositions.length - 1;
    if (steps < 1) return;
    const target = gsap.utils.clamp(0, steps, Math.round(idx));
    const x = xFromIndex(target);
    gsap.to(wrapper, {
      x,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        sliderDraggable?.update();
        if (sliderGroup) sliderGroup.position.x = (gsap.getProperty(wrapper, 'x') as number) || 0;
      },
      onComplete: () => {
        if (sliderGroup) sliderGroup.position.x = x;
        syncAllCardsToWebGL();
      },
    });
    if (pageDraggable) {
      const prog = target / steps;
      gsap.set(paginationControl, { x: (pageDraggable.maxX || 0) * prog });
      pageTimeline?.progress(prog);
    }
    syncSliderAria(target);
  };

  const onSliderKeydown = (e: KeyboardEvent) => {
    if (!sliderDraggable) return;
    const steps = snapPositions.length - 1;
    if (steps < 1) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    const onControl = t === paginationControl;
    let target: number | null = null;
    if (e.key === 'ArrowRight') target = Math.round(indexFromX(sliderDraggable.x)) + 1;
    else if (e.key === 'ArrowLeft') target = Math.round(indexFromX(sliderDraggable.x)) - 1;
    else if (onControl && e.key === 'ArrowUp') target = Math.round(indexFromX(sliderDraggable.x)) + 1;
    else if (onControl && e.key === 'ArrowDown') target = Math.round(indexFromX(sliderDraggable.x)) - 1;
    else if (onControl && e.key === 'Home') target = 0;
    else if (onControl && e.key === 'End') target = steps;
    if (target === null) return;
    e.preventDefault();
    moveToIndex(target);
  };

  const rebuildSlider = () => {
    sliderDraggable?.kill();
    sliderDraggable = null;
    pageDraggable?.kill();
    pageDraggable = null;
    pageTimeline?.kill();
    pageTimeline = null;

    Array.from(paginationInner.children).forEach((child) => {
      if (child !== paginationControl) child.remove();
    });

    const slides = getVisibleSlides();
    if (!slides.length) return;

    const firstRect = slides[0].getBoundingClientRect();
    const gap = parseFloat(window.getComputedStyle(wrapper).gap) || 0;
    const slideWidth = firstRect.width + gap;
    const minX = getMinX();
    snapPositions = buildSnapPositions(minX, slideWidth);

    const steps = snapPositions.length - 1;
    if (steps < 1) {
      gsap.set(wrapper, { x: 0 });
      gsap.set(paginationControl, { x: 0 });
      if (sliderGroup) sliderGroup.position.x = 0;
      syncSliderAria(0);
      gsap.to(pagination, { autoAlpha: 0, pointerEvents: 'none', duration: 0.3 });
      return;
    }

    gsap.to(pagination, { autoAlpha: 1, pointerEvents: 'auto', duration: 0.3 });

    // Create pagination dots
    const frag = document.createDocumentFragment();
    const dots: HTMLElement[] = [];
    let firstDot: HTMLElement | null = null;
    for (let i = 0; i <= steps; i++) {
      const dot = document.createElement('div');
      dot.className = 'h-3 min-h-3 w-3 min-w-3 bg-darkPurple';
      dot.setAttribute('aria-hidden', 'true');
      if (i === 0) dot.classList.add('opacity-0');
      if (i === 1) firstDot = dot;
      if (i > 0) dots.push(dot);
      frag.appendChild(dot);
    }
    paginationInner.appendChild(frag);

    const innerGap = parseFloat(window.getComputedStyle(paginationInner).gap) || 12;
    dotPitch = firstDot ? firstDot.offsetLeft || firstDot.offsetWidth + innerGap : 15;

    pageTimeline = gsap.timeline({ paused: true }).to(dots, {
      x: -dotPitch,
      duration: 0.5,
      stagger: 0.5,
      ease: 'power4.inOut',
    });

    const syncPageFromSlider = () => {
      if (!sliderDraggable || !pageDraggable) return;
      const prog = gsap.utils.clamp(0, 1, progressFromX(sliderDraggable.x));
      gsap.set(paginationControl, { x: (pageDraggable.maxX || 0) * prog });
      pageDraggable.update();
      pageTimeline?.progress(prog);
      if (sliderGroup) sliderGroup.position.x = sliderDraggable.x;
    };

    sliderDraggable = Draggable.create(wrapper, {
      bounds: { minX, maxX: 0 },
      type: 'x',
      inertia: true,
      throwResistance: 2500,
      maxDuration: 1,
      allowContextMenu: window.innerWidth >= bp.lg,
      snap: (val) => {
        const step = slideStep || 1;
        const fn = sliderDraggable?.getDirection('velocity') === 'left' ? Math.ceil : Math.floor;
        const idx = gsap.utils.clamp(0, snapPositions.length - 1, fn(-val / step));
        return snapPositions[idx];
      },
      onDrag: syncPageFromSlider,
      onThrowUpdate: syncPageFromSlider,
    })[0];

    const maxPageX = dotPitch * steps;
    pageDraggable = Draggable.create(paginationControl, {
      bounds: { minX: 0, maxX: maxPageX },
      type: 'x',
      inertia: true,
      throwResistance: 4000,
      maxDuration: 0.5,
      snap: (val) => gsap.utils.clamp(0, maxPageX, Math.round(val / dotPitch) * dotPitch),
      onDrag: function () {
        const prog = maxPageX ? this.x / maxPageX : 0;
        const targetX = xFromIndex(prog * steps);
        gsap.set(wrapper, { x: targetX });
        sliderDraggable?.update();
        pageTimeline?.progress(prog);
        if (sliderGroup) sliderGroup.position.x = targetX;
      },
      onThrowUpdate: function () {
        const prog = maxPageX ? this.x / maxPageX : 0;
        const targetX = xFromIndex(prog * steps);
        gsap.set(wrapper, { x: targetX });
        sliderDraggable?.update();
        pageTimeline?.progress(prog);
        if (sliderGroup) sliderGroup.position.x = targetX;
      },
    })[0];
  };

  rebuildSlider();
  sliderEl.addEventListener('keydown', onSliderKeydown);

  const onSliderResize = () => {
    rebuildSlider();
    if (sliderGroup && sliderDraggable) {
      sliderGroup.position.x = sliderDraggable.x;
    }
  };
  resizeManager.add(onSliderResize);

  // Entrance animation + MomentumHover (after WebGLImage textures are ready)
  const momentumHover = initMomentumHover(sliderEl, (_target, slideEl) => syncSlideToWebGL(slideEl));

  let entranceTween: gsap.core.Tween | null = null;
  const startEntrance = () => {
    if (prefersReducedMotion()) return;
    const initialSlides = getVisibleSlides().slice(0, 4);
    entranceTween = gsap.from(initialSlides, {
      x: 120,
      stagger: 0.1,
      duration: 1.4,
      ease: 'slowDown-2',
      force3D: true,
      onUpdate: syncAllCardsToWebGL,
      onComplete: syncAllCardsToWebGL,
      scrollTrigger: {
        trigger: sliderEl,
        start: 'top bottom+=100px',
        once: true,
      },
    });
    syncAllCardsToWebGL();
  };

  let entranceStarted = false;
  const startEntranceOnce = () => {
    if (entranceStarted || ac.signal.aborted) return;
    entranceStarted = true;
    startEntrance();
  };

  const attachWebGLToCards = (exp: WebGLExperienceAPI | null) => {
    if (ac.signal.aborted) return;
    if (!exp || !canUseDistortion()) {
      applyDomFallbackToCards();
      startEntranceOnce();
      return;
    }
    activeExp = exp;
    if (!sliderGroup) {
      sliderGroup = exp.createGroup();
      exp.fgScene.add(sliderGroup);
    } else if (!sliderGroup.parent) {
      exp.fgScene.add(sliderGroup);
    }

    const readyPromises: Promise<unknown>[] = [];
    sliderEl.querySelectorAll<HTMLImageElement>('.parts-caseStudySlider__slide img.parts-caseStudyCard__image').forEach((img) => {
      const id = img.getAttribute('data-case-study-id');
      if (!id) return;
      if (img.loading === 'lazy') img.loading = 'eager';
      const existing = webglImages.get(id);
      if (existing && !existing.isDestroyed && existing.isWebGLActive) {
        readyPromises.push(existing.ready);
        return;
      }
      setDistortionState(img.closest('.parts-caseStudyCard'), 'pending');
      const wImg = exp.createImage(img, { group: sliderGroup });
      webglImages.set(id, wImg);
      readyPromises.push(
        wImg.ready.then(() => {
          if (!ac.signal.aborted) syncAllCardsToWebGL();
        })
      );
    });

    if (readyPromises.length > 0) {
      Promise.allSettled(readyPromises).then(() => {
        if (ac.signal.aborted) return;
        syncAllCardsToWebGL();
        startEntranceOnce();
      });
    } else {
      startEntranceOnce();
    }
  };

  let cancelWhenWebGLReady: () => void = () => {};
  if (canUseDistortion()) {
    section.querySelectorAll<HTMLElement>('.parts-caseStudyCard').forEach((card) => {
      setDistortionState(card, 'pending');
    });
    cancelWhenWebGLReady = whenWebGLReady(attachWebGLToCards);
  } else {
    applyDomFallbackToCards();
    startEntranceOnce();
  }

  const stopCapWatch = onDistortionCapabilityChange((enabled) => {
    if (ac.signal.aborted) return;
    cancelWhenWebGLReady();
    if (enabled) {
      cancelWhenWebGLReady = whenWebGLReady(attachWebGLToCards);
    } else {
      applyDomFallbackToCards();
    }
  });

  // Card title hover SplitText
  const cardSplits: SplitText[] = [];
  sliderEl.querySelectorAll<HTMLElement>('.parts-caseStudySlider__slide').forEach((slide) => {
    const texts = slide.querySelectorAll<HTMLElement>('.parts-caseStudyCard__textInner');
    if (texts.length < 2) return;
    const tl = gsap.timeline({ paused: true });
    const split = SplitText.create(texts, {
      type: 'lines,chars',
      charsClass: 'char',
      autoSplit: false,
      onSplit: (self) => {
        self.lines.forEach((line, idx) => {
          const chars = line.querySelectorAll('.char');
          tl.to(
            chars,
            { yPercent: -100, ease: 'power1.inOut', stagger: 0.03, duration: 0.2 },
            idx === 0 ? 0 : '<+0.1'
          );
        });
      },
    });
    cardSplits.push(split);
    slide.addEventListener(
      'mouseenter',
      () => {
        if (!prefersReducedMotion() && window.innerWidth >= bp.lg) tl.play();
      },
      { signal: ac.signal }
    );
    slide.addEventListener(
      'mouseleave',
      () => {
        if (!prefersReducedMotion() && window.innerWidth >= bp.lg) tl.reverse();
      },
      { signal: ac.signal }
    );
  });

  return () => {
    ac.abort();
    cancelWhenWebGLReady();
    stopCapWatch();
    mm.revert();
    resizeManager.remove(onSliderResize);
    sliderEl.removeEventListener('keydown', onSliderKeydown);
    momentumHover?.destroy();
    entranceTween?.kill();
    sliderDraggable?.kill();
    pageDraggable?.kill();
    pageTimeline?.kill();
    stickerTrail.destroy();
    destroyMobileStickerSlider?.();
    cardSplits.forEach((s) => s.revert());
    webglImages.forEach((wImg) => wImg.destroy());
    webglImages.clear();
    if (sliderGroup && activeExp) {
      activeExp.fgScene.remove(sliderGroup);
      sliderGroup = null;
    }
  };
}
