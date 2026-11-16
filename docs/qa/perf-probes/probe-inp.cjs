// Phase 1 probe: lab INP proxy (event timing durations) + off-screen video pause + focus/hover states.
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE = 'http://localhost:4322';
const OUT = '/home/ankit/GitHub/decbricks/docs/qa/perf-before/interaction.json';
const OBS = `
window.__ev = [];
new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ n: e.name, d: Math.round(e.duration), t: Math.round(e.startTime) }); })
  .observe({ type: 'event', buffered: true, durationThreshold: 16 });`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const results = [];
  const routes = [['home', '/'], ['services', '/services'], ['about', '/about'], ['contact', '/contact'], ['terms', '/terms'], ['notfound', '/404']];
  for (const [name, route] of routes) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.addInitScript(OBS);
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(4500);

      // interactions (skip missing)
      const menuBtn = page.locator('[aria-label*="menu" i], [aria-label*="Menu"]').first();
      if (await menuBtn.count()) {
        await menuBtn.click().catch(() => {});
        await page.waitForTimeout(900);
        await menuBtn.click().catch(() => {});
        await page.waitForTimeout(600);
      }
      // scroll sweep (fast)
      await page.evaluate(() => new Promise((res) => { let y = 0; const t = setInterval(() => { y += 900; scrollTo(0, y); if (y > 12000) { clearInterval(t); res(); } }, 60); }));
      await page.waitForTimeout(400);
      // footer scroll-top
      const top = page.locator('.parts-btnScrollTop').first();
      if (await top.count()) { await top.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(700); }
      // testimonial controls on home
      const nxt = page.locator('.tst-btn--next, [aria-label*="next" i]').first();
      if (await nxt.count()) { await nxt.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(500); }
      const dots = page.locator('.tst-dot').first();
      if (await dots.count()) { await dots.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(500); }

      const ev = await page.evaluate(() => window.__ev || []);
      const slow = ev.filter((e) => e.d >= 50).sort((a, b) => b.d - a.d).slice(0, 6);
      const maxD = ev.length ? Math.max(...ev.map((e) => e.d)) : 0;
      results.push({ route: name, interactions: ev.length, maxEventMs: maxD, worst: slow, errs: errs.slice(0, 4) });
    } catch (e) {
      results.push({ route: name, fatal: String(e).slice(0, 120) });
    }
    await ctx.close();
  }
  // video off-screen pause test on home (desktop viewport, showreel player)
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(4500);
  const vid = await p2.evaluate(() => {
    const v = document.querySelector('.parts-webglVideoPlayer video.webgl-video');
    if (!v) return { present: false };
    v.muted = true;
    return { present: true, paused: v.paused, src: (v.currentSrc || '').split('/').pop() };
  });
  let offscreen = null;
  if (vid.present) {
    const playBtn = p2.locator('.parts-webglVideoPlayer .play-button').first();
    if (await playBtn.count()) {
      await playBtn.click({ timeout: 2000 }).catch(() => {});
      await p2.waitForTimeout(1200);
      // scroll far away
      await p2.evaluate(() => scrollTo(0, 9000));
      await p2.waitForTimeout(1500);
      offscreen = await p2.evaluate(() => {
        const v = document.querySelector('.parts-webglVideoPlayer video.webgl-video');
        const heroPrev = document.querySelector('video[data-preview-mp4]');
        return { showreel: v ? { paused: v.paused, time: +v.currentTime.toFixed(1) } : null, heroPreviewPaused: heroPrev ? heroPrev.paused : null };
      });
    }
  }
  // keyboard focus-visible sample
  await p2.evaluate(() => scrollTo(0, 0));
  await p2.keyboard.press('Tab');
  await p2.waitForTimeout(200);
  const focusInfo = await p2.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { tag: el.tagName, label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), outlineWidth: cs.outlineWidth, matchesFV: el.matches(':focus-visible') };
  });
  await p2.waitForTimeout(100);
  const hoverInfo = await p2.evaluate(async () => {
    const pill = document.querySelector('.structure-menu a[href="/about"], .structure-menu a');
    if (!pill) return null;
    const before = getComputedStyle(pill).backgroundColor;
    pill.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const after = getComputedStyle(pill).backgroundColor;
    const chars = pill.querySelectorAll('.parts-btnText__label span, span').length;
    return { before, after, changed: before !== after, chars };
  });
  require('fs').writeFileSync(OUT, JSON.stringify({ results, video: { vid, offscreen }, focusInfo, hoverInfo }, null, 1));
  console.log('INP/STATE:');
  for (const r of results) console.log(JSON.stringify(r));
  console.log('VIDEO offscreen: ' + JSON.stringify(offscreen));
  console.log('FOCUS: ' + JSON.stringify(focusInfo));
  console.log('HOVER: ' + JSON.stringify(hoverInfo));
  await browser.close();
})();
