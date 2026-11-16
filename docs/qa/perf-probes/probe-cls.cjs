// Phase 1 probe: CLS source attribution + font-timing correlation on /services (+ home, repeat-visit variant)
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE = 'http://localhost:4322';
const OUT = '/home/ankit/GitHub/decbricks/docs/qa/perf-before/cls-sources.json';
const OBS = `
window.__cls = []; let __total = 0;
new PerformanceObserver((l) => {
  for (const e of l.getEntries()) {
    if (e.hadRecentInput) continue;
    __total += e.value;
    window.__cls.push({
      t: Math.round(e.startTime), v: +e.value.toFixed(4),
      sources: (e.sources || []).map((s) => {
        const n = s.node;
        return {
          tag: n ? n.tagName + (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').slice(0, 2).join('.') : '') : '?',
          prev: s.previousRect ? [s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height] : null,
          cur: s.currentRect ? [s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height] : null,
        };
      }).slice(0, 4),
    });
  }
}).observe({ type: 'layout-shift', buffered: true });
window.__fontEvents = [];
document.fonts.addEventListener('loadingdone', (e) => {
  window.__fontEvents.push({ t: Math.round(performance.now()), fonts: e.fontfaces ? Array.from(e.fontfaces).map((f) => f.family) : [] });
});
document.fonts.ready.then(() => window.__fontsReady = Math.round(performance.now()));
`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(OBS);
  const report = [];
  for (const route of ['/services', '/services', '/about', '/']) {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(7000);
    const data = await page.evaluate(() => ({
      path: location.pathname,
      repeatVisit: document.documentElement.classList.contains('loader-skip'),
      totalCls: +window.__cls ? +((window.__cls || []).reduce((s, x) => s + x.v, 0)).toFixed(4) : 0,
      shifts: window.__cls.filter((s) => s.v > 0.002),
      fontEvents: window.__fontEvents,
      fontsReadyAt: window.__fontsReady,
      monoLoaded: document.fonts.check('16px "Departure Mono"'),
      powerLoaded: document.fonts.check('16px "Power Grotesk"'),
    }));
    report.push(data);
    console.log('--- ' + route + (data.repeatVisit ? ' (repeat visit)' : ' (first visit)'));
    console.log('  total CLS=' + data.totalCls + ' fontsReady@' + data.fontsReadyAt + 'ms mono=' + data.monoLoaded + ' power=' + data.powerLoaded);
    for (const s of data.shifts.slice(0, 6)) {
      console.log(`  shift @${s.t}ms v=${s.v} ` + s.sources.map((x) => `${x.tag} ${JSON.stringify(x.prev)}->${JSON.stringify(x.cur)}`).join(' | ').slice(0, 240));
    }
  }
  require('fs').writeFileSync(OUT, JSON.stringify(report, null, 1));
  await browser.close();
  console.log('CLS_PROBE_DONE');
})();
