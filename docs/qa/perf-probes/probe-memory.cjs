// Phase 1 probe: listener-leak instrumentation + heap trend over 12 route navigations
// + swap-state checks (BUG-015 canvases, nav active state, body classes) + INP sampling.
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE = 'http://localhost:4322';
const OUT = '/home/ankit/GitHub/decbricks/docs/qa/perf-before/memory-nav.json';
const INIT = `
(() => {
  window.__addon = 0; window.__removed = 0; window.__bysrc = new Map();
  const origA = EventTarget.prototype.addEventListener;
  const origR = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (t, l, o) {
    window.__addon++; const k = (this === window ? 'window' : this === document ? 'document' : this === document.body ? 'body' : (this.tagName || 'obj'));
    window.__bysrc.set(k, (window.__bysrc.get(k) || 0) + 1); return origA.call(this, t, l, o);
  };
  EventTarget.prototype.removeEventListener = function (t, l, o) { window.__removed++; return origR.call(this, t, l, o); };
})();`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  const cdp = await ctx.newCDPSession(page);

  const snap = async (label) => {
    await cdp.send('HeapProfiler.collectGarbage');
    const m = await page.evaluate(() => ({
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1,
      addon: window.__addon, removed: window.__removed,
      bysrc: Object.fromEntries([...window.__bysrc.entries()].filter(([, v]) => v > 30).sort((a, b) => b[1] - a[1]).slice(0, 8)),
      canvases: Array.from(document.querySelectorAll('canvas.webgl')).map((c) => c.width + 'x' + c.height),
      stCount: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : -1,
      bodyClass: document.body.className.slice(0, 80),
      ariaCurrent: Array.from(document.querySelectorAll('.structure-menu a[aria-current]')).map((a) => a.getAttribute('href')),
      path: location.pathname,
    }));
    return { label, ...m };
  };

  const hops = [
    '/', '/services', '/about', '/contact', '/terms', '/', '/services', '/contact', '/about', '/', '/terms', '/404', '/',
  ];
  const log = [];
  await page.goto(BASE + hops[0], { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  log.push(await snap('boot ' + hops[0]));
  for (let i = 1; i < hops.length; i++) {
    // client-side navigation via link click (nav pills exist for 4 routes; fallback goto)
    const target = hops[i];
    const linkSel = `.structure-menu a[href="${target}"]`;
    const hasLink = await page.locator(linkSel).count();
    if (hasLink) {
      await page.locator(linkSel).first().click();
      await page.waitForTimeout(2600); // transition 0.5s + init settle
    } else {
      await page.goto(BASE + target, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2600);
    }
    log.push(await snap('hop' + i + ' -> ' + target));
  }
  require('fs').writeFileSync(OUT, JSON.stringify({ log, errs: errs.slice(0, 10) }, null, 1));
  console.log('MEM: hops=' + log.length + ' errs=' + errs.length);
  for (const l of log) console.log(JSON.stringify(l));
  await browser.close();
})();
