import './core/gsap';
import { ScrollTrigger, bp, bus } from './core/gsap';
import { initSmoothScroll } from './smooth-scroll';
import { initLoader } from './loader';
import type { Hero } from './hero';
import { initPreviewVideos } from './media';
import { initCookies } from './cookies';
import { destroySmileyTexts, initSmileyTexts } from './smiley-text';
import { initButtons } from './buttons';
import {
  closeMobileMenuIfOpen,
  getHeaderOffset,
  initMenu,
  refreshHeaderForRoute,
  scrollToAnchor,
  setActiveAnchor,
} from './menu';
import { initPageTransition } from './page-transition';
import { preloadCurrentPageImages } from './image-preload-runtime';
import { initCalModals } from './cal-modal';
import { initAnalytics, trackPageView } from './analytics';
import { initFooter } from './footer';
import { getWebGLExperience, initWebGL, resetHeroLifecycleState } from './webgl/experience';
import { preloadDistortionForIntro } from './webgl/preload';

let hero: Hero | undefined;
let heroPlayHandler: (() => void) | null = null;

// Generation counter & per-generation lifecycle flags so late-resolving
// dynamic imports never touch a superseded route's DOM or miss loader/swap
// bus milestones.
let routeGen = 0;
let entranceDoneInGen = false;
let heroStartInGen = false;
let videoPlayerReady: Promise<void> = Promise.resolve();

bus.on('transition-entrance-done', () => {
  entranceDoneInGen = true;
});
bus.on('hero-transition-start', () => {
  heroStartInGen = true;
});

// Per-route module teardowns collected from every init*() that returns one.
// Runs on onBeforeSwap so timed intervals, ticker callbacks, resize handlers,
// gsap.matchMedia contexts and Draggables never accumulate across route swaps.
let pageTearDowns: Array<() => void> = [];
function teardown(fn: unknown) {
  if (typeof fn === 'function') pageTearDowns.push(fn as () => void);
}

function shouldMountServicesPage(): boolean {
  return Boolean(
    document.querySelector('.parts-serviceNavLink') ||
      (window.innerWidth >= bp.lg && document.querySelector('.sections-servicesHero'))
  );
}

const yieldTask = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

function initRouteFeatures(gen = routeGen): void {
  // Kick off all matching chunk downloads in parallel immediately.
  const heroImport = document.querySelector('.sections-hero') ? import('./hero') : null;
  void heroImport?.catch(() => {});

  const servicesPageImport = shouldMountServicesPage() ? import('./services-page') : null;
  if (servicesPageImport) {
    void servicesPageImport
      .then((m) => {
        if (gen !== routeGen) return;
        teardown(m.initServicesPage());
        if (entranceDoneInGen && !(window as any).animationsEnabled) {
          bus.emit('transition-entrance-done');
        }
        if (heroStartInGen) {
          bus.emit('hero-transition-start');
        }
      })
      .catch((err) => {
        console.error('[main] Failed to load services-page module:', err);
        if (gen === routeGen) bus.emit('hero-ready');
      });
  }

  const vpImport = document.querySelector('.parts-webglVideoPlayer')
    ? import('./video-player')
    : null;
  videoPlayerReady = vpImport
    ? vpImport
        .then((m) => {
          if (gen !== routeGen) return;
          teardown(m.initVideoPlayer());
        })
        .catch((err) => {
          console.error('[main] Failed to load video-player module:', err);
        })
    : Promise.resolve();

  const deferredRunners: Array<() => Promise<() => unknown>> = [];
  const queue = <T>(check: boolean, loader: () => Promise<T>, init: (mod: T) => unknown) => {
    if (!check) return;
    const p = loader();
    deferredRunners.push(async () => {
      const mod = await p;
      return () => init(mod);
    });
  };

  queue(
    Boolean(document.querySelector('.parts-serviceCard')),
    () => import('./services'),
    (m) => m.initServices()
  );
  queue(
    Boolean(document.querySelector('.parts-keyword__inner, .parts-btnPill')),
    () => import('./keywords'),
    (m) => m.initKeywords()
  );
  queue(
    Boolean(document.querySelector('.mouse-target')),
    () => import('./case-studies'),
    (m) => m.initCaseStudies()
  );
  queue(
    Boolean(document.querySelector('.tst-band')),
    () => import('./testimonials'),
    (m) => m.initTestimonials()
  );
  queue(
    Boolean(document.querySelector('.sections-contactForm')),
    () => import('./contact'),
    (m) => m.initContact()
  );
  queue(
    Boolean(document.querySelector('.cal-embed-widget')),
    () => import('./cal-embed'),
    (m) => m.initCalEmbed()
  );
  queue(
    Boolean(document.querySelector('.page-legal')),
    () => import('./legal-page'),
    (m) => m.initLegalPage()
  );

  // Yield a macrotask between below-the-fold module inits so their script/layout
  // work never coalesces into one long microtask checkpoint (PERF-06).
  void (async () => {
    await videoPlayerReady;
    for (const getRunner of deferredRunners) {
      if (gen !== routeGen) return;
      try {
        const runInit = await getRunner();
        await yieldTask();
        if (gen !== routeGen) return;
        teardown(runInit());
      } catch (err) {
        console.error('[main] Failed to load route module:', err);
      }
    }
  })();
}

async function mountHeroForCurrentPage(gen = routeGen): Promise<void> {
  if (heroPlayHandler) {
    bus.off('hero-transition-start', heroPlayHandler);
    heroPlayHandler = null;
  }
  const heroEl = document.querySelector<HTMLElement>('.sections-hero');
  const hasServicesHero = shouldMountServicesPage();
  if (!heroEl) {
    if (!hasServicesHero) {
      bus.emit('hero-ready');
    }
    return;
  }

  let playRequested = heroStartInGen;
  heroPlayHandler = () => {
    if (heroPlayHandler) {
      bus.off('hero-transition-start', heroPlayHandler);
      heroPlayHandler = null;
    }
    if (hero) {
      hero.playEntrance();
    } else {
      playRequested = true;
    }
  };
  bus.on('hero-transition-start', heroPlayHandler);

  try {
    const [{ Hero }] = await Promise.all([import('./hero'), videoPlayerReady]);
    if (gen !== routeGen || !document.body.contains(heroEl)) return;
    hero = new Hero(heroEl);
    if (playRequested) {
      if (heroPlayHandler) {
        bus.off('hero-transition-start', heroPlayHandler);
        heroPlayHandler = null;
      }
      hero.playEntrance();
    }
  } catch (err) {
    console.error('[main] Failed to load hero module:', err);
    if (gen === routeGen) bus.emit('hero-ready');
  }
}

function playInlineVideos() {
  document.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
    if (v.src || v.querySelector('source')) v.play().catch(() => {});
  });
}

// Initial boot
initSmoothScroll();
teardown(initPreviewVideos());
initWebGL();
initSmileyTexts();
teardown(initButtons());
initMenu();
teardown(initCalModals());
teardown(initFooter());
initRouteFeatures(routeGen);
initCookies();
initAnalytics();

initPageTransition({
  onBeforeSwap: () => {
    routeGen++;
    entranceDoneInGen = false;
    heroStartInGen = false;
    resetHeroLifecycleState();
    if (heroPlayHandler) {
      bus.off('hero-transition-start', heroPlayHandler);
      heroPlayHandler = null;
    }
    hero?.destroy();
    hero = undefined;
    pageTearDowns.forEach((t) => t());
    pageTearDowns = [];
    destroySmileyTexts();
    ScrollTrigger.getAll().forEach((st) => st.kill());
  },
  onAfterSwap: (newPath: string) => {
    const gen = routeGen;
    teardown(initPreviewVideos());
    // The swap replaced the `.page` DOM (including the WebGL canvases in the
    // footer) — re-bind the renderers to the new canvases before the
    // per-route scene targets are rebuilt.
    const webgl = getWebGLExperience();
    webgl?.reattachCanvases();
    webgl?.rebuildPageTargets();
    initSmileyTexts();
    teardown(initButtons());
    teardown(initCalModals());
    teardown(initFooter());
    refreshHeaderForRoute(newPath);
    trackPageView(newPath); // consent-gated SPA page_view (T-10)
    initRouteFeatures(gen);
    void mountHeroForCurrentPage(gen);
    playInlineVideos();
  },
  getHeaderOffset,
  closeMobileMenuIfOpen,
  setActiveAnchor,
  scrollToAnchor,
});

const onInitialTransitionEntranceDone = () => {
  bus.off('transition-entrance-done', onInitialTransitionEntranceDone);
  void mountHeroForCurrentPage(routeGen);
};
bus.on('transition-entrance-done', onInitialTransitionEntranceDone);

const startLoaderBoot = () => {
  const waitForAssets = Promise.allSettled([
    preloadCurrentPageImages(document, { timeoutMs: 3400 }),
    preloadDistortionForIntro({ timeoutMs: 2400 }),
  ]).then(() => undefined);

  const launch = () => {
    initLoader({ waitForAssets, assetTimeoutMs: 3400 });
    playInlineVideos();
  };

  const fontsReady = document.fonts?.ready;
  if (!fontsReady) {
    launch();
    return;
  }

  let launched = false;
  const onceLaunch = () => {
    if (launched) return;
    launched = true;
    window.clearTimeout(fontTimer);
    launch();
  };
  const fontTimer = window.setTimeout(onceLaunch, 300);
  void fontsReady.then(onceLaunch, onceLaunch);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startLoaderBoot, { once: true });
} else {
  startLoaderBoot();
}
