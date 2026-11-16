// Phase 1 probe (v2): reproduce services CLS 0.371 under LH-like conditions —
// cold cache, CDP slow-4G network + 4x CPU, first visit only, source attribution.
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE = 'http://localhost:4322';
const OUT = '/home/ankit/GitHub/decbricks/docs/qa/perf-before/cls-sources-throttled.json';
const OBS = `
window.__cls = [];
new PerformanceObserver((l) => {
  for (const e of l.getEntries()) {
    if (e.hadRecentInput) continue;
    window.__cls.push({
      t: Math.round(e.startTime), v: +e.value.toFixed(4),
      sources: (e.sources || []).map((s) => {
        const n = s.node;
        const desc = n ? (n.tagName + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\\s+/).slice(0, 3).join('.') : '') + (n.id ? '#' + n.id : '')) : '?';
        return { d: desc, prev: s.previousRect ? [s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height].map(Math.round) : null, cur: s.currentRect ? [s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height].map(Math.round) : null };
      }).slice(0, 6),
    });
  }
}).observe({ type: 'layout-shift', buffered: true });
window.__fontEvents = [];
document.fonts.addEventListener('loadingdone', (e) => {
  window.__fontEvents.push({ t: Math.round(performance.now()), fam: e.fontfaces ? Array.from(e.fontfaces).map((f) => f.family) : [] });
});
document.fonts.ready.then(() => { window.__fontsReady = Math.round(performance.now()); });
window.__imgTimings = [];
new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name.includes('/assets/') || e.name.includes('.webp')) window.__imgTimings.push({ u: e.name.split('/').pop().slice(0, 44), s: Math.round(e.startTime), d: Math.round(e.duration) }); }).observe({ type: 'resource', buffered: true });
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
  const cdp = await ctx.newCDPSession(page);
  // LH mobile throttling defaults: slow-4G (1.6Mbps / 150ms RTT) + 4x CPU
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.goto(BASE + '/services', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(9000);
  const data = await page.evaluate(() => ({
    totalCls: +((window.__cls || []).reduce((s, x) => s + x.v, 0)).toFixed(4),
    shifts: window.__cls.filter((s) => s.v > 0.002),
    fontEvents: window.__fontEvents,
    fontsReadyAt: window.__fontsReady,
    loaderSkip: document.documentElement.classList.contains('loader-skip'),
    imgSlow: window.__imgTimings.filter((i) => i.d > 800).slice(0, 8),
  }));
  console.log('THROTTLED /services: totalCls=' + data.totalCls + ' fontsReady@' + data.fontsReadyAt + 'ms loaderSkip=' + data.loaderSkip);
  for (const s of data.shifts) {
    console.log(`  shift @${s.t}ms v=${s.v}`);
    for (const src of s.sources) console.log(`    src ${src.d} ${JSON.stringify(src.prev)} -> ${JSON.stringify(src.cur)}`);
  }
  console.log('  slow imgs: ' + JSON.stringify(data.imgSlow));
  console.log('  font events: ' + JSON.stringify(data.fontEvents));
  require('fs').writeFileSync(OUT, JSON.stringify(data, null, 1));
  await browser.close();
  console.log('CLS2_DONE');
})();
