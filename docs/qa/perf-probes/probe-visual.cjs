// Phase 1 probe: overflow/h-scroll/broken images/console/tap-targets + fonts + video states
// across all routes x many widths. Writes JSON + prints compact results.
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE = 'http://localhost:4322';
const ROUTES = [
  ['home', '/'], ['services', '/services'], ['about', '/about'],
  ['contact', '/contact'], ['terms', '/terms'], ['notfound', '/404'],
];
const WIDTHS = [
  [360, 780], [390, 844], [430, 932], [844, 390], // 844x390 = landscape phone
  [768, 1024], [1024, 800], [1100, 800], [1280, 800],
  [1366, 850], [1440, 900], [1536, 960], [1920, 1080], [2560, 1200],
];
const OUT = process.env.VISUAL_OUT || '/home/ankit/GitHub/decbricks/docs/qa/perf-before/visual-sweep.json';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const results = [];
  for (const [name, route] of ROUTES) {
    for (const [w, h] of WIDTHS) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        hasTouch: w < 768,
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 160)));
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 160));
      });
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(4500); // loader + entrance settle
        const data = await page.evaluate(() => {
          const de = document.documentElement;
          const hsX = de.scrollWidth - de.innerWidth;
          const bodyX = document.body.scrollWidth - de.innerWidth;
          const brokenImgs = Array.from(document.images)
            .filter((i) => i.complete && i.naturalWidth === 0)
            .map((i) => i.currentSrc || i.src).slice(0, 5);
          const vids = Array.from(document.querySelectorAll('video')).map((v) => ({
            paused: v.paused,
            muted: v.muted,
            hasPoster: Boolean(v.getAttribute('poster')),
            inViewport: (() => {
              const r = v.getBoundingClientRect();
              return r.bottom > 0 && r.top < innerHeight && r.width > 0;
            })(),
          }));
          // tap targets: visible interactive elements with min side < 44px
          const small = [];
          for (const el of document.querySelectorAll('a[href],button,input[type="checkbox"],input[type="range"],summary')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            if (el.closest('[aria-hidden="true"]')) continue;
            const min = Math.min(r.width, r.height);
            if (min < 44 && small.length < 12) {
              small.push({ min: Math.round(min), tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40) });
            }
          }
          // typography sample
          const ff = (sel) => {
            const el = document.querySelector(sel);
            return el ? getComputedStyle(el).fontFamily.slice(0, 60) : null;
          };
          return {
            hsX, bodyX, brokenImgs, vids, small,
            fonts: {
              h1: ff('h1'), brand: ff('.font-brand'), body: ff('main p'), kicker: ff('.u-kicker'),
              loaded: Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family + ':' + f.weight).slice(0, 12),
              powerGrotesk: document.fonts.check('16px "Power Grotesk"'),
              bricolage: document.fonts.check('16px "Bricolage Grotesk"'),
            },
            hscrollDetected: hsX > 1 || bodyX > 1,
          };
        });
        results.push({ route: name, w, h, errs: errs.slice(0, 6), ...data });
      } catch (e) {
        results.push({ route: name, w, h, fatal: String(e).slice(0, 160) });
      }
      await ctx.close();
    }
  }
  require('fs').writeFileSync(OUT, JSON.stringify(results, null, 1));
  // compact summary
  const bad = results.filter((r) => r.hscrollDetected || (r.brokenImgs && r.brokenImgs.length) || (r.errs && r.errs.length) || r.fatal);
  console.log('SWEEP: entries=' + results.length + ' flagged=' + bad.length);
  for (const r of bad.slice(0, 40)) console.log(JSON.stringify({ route: r.route, w: r.w, h: r.h, hsX: r.hsX, bodyX: r.bodyX, broken: r.brokenImgs, errs: r.errs, fatal: r.fatal }));
  const tapBad = results.filter((r) => r.small && r.small.length);
  console.log('tap<44 on ' + tapBad.length + '/' + results.length + ' viewports; samples:');
  const seen = new Set();
  for (const r of tapBad) for (const s of r.small) { const k = s.tag + '|' + s.label; if (!seen.has(k)) { seen.add(k); console.log('  w' + r.w + ' ' + r.route + ' min=' + s.min + ' <' + s.tag + '> ' + s.label); } }
  const bg = results.filter((r) => r.fonts && r.fonts.bricolage);
  console.log('bricolage-loaded routes: ' + bg.length);
  const fam = new Set();
  results.forEach((r) => r.fonts && [r.fonts.h1, r.fonts.brand, r.fonts.body, r.fonts.kicker].forEach((x) => x && fam.add(x)));
  console.log('font families seen:'); fam.forEach((f) => console.log('  ' + f));
  await browser.close();
})();
