#!/usr/bin/env node
/**
 * Repeatable Playwright production verifier for WebGL hover distortion:
 *  - 30x reliability matrix (hard/warm reload, Fast/Slow 4G + 4x CPU, SPA + back,
 *    800->1440 resize, DPR 2 + visibility, immediate hover, delayed/paused video)
 *  - Context leak gauntlet (10 SPA swaps <= 2 GL contexts), lose/restore recovery,
 *    disabled-WebGL / reduced-motion / mobile-touch zero-chunk verification,
 *    first-hover frame-time check, and resting vs hover PNG captures.
 */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from '/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';

const BATCH = process.env.BATCH || 'ALL';
const PORT = Number(process.env.PORT || (BATCH === 'B' ? 4359 : BATCH === 'C' ? 4360 : 4358));
const BASE = `http://127.0.0.1:${PORT}`;
const ITERS = Number(process.env.ITERS || 30);
const SHOT_OUT = 'docs/qa/shots';
const TMP_OUT = '/tmp/webgl-verify';
fs.mkdirSync(SHOT_OUT, { recursive: true });
fs.mkdirSync(`${TMP_OUT}/shots`, { recursive: true });

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('./node_modules/.bin/astro', ['preview', '--host', '127.0.0.1', '--port', String(PORT)], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    const timer = setTimeout(() => reject(new Error('Preview server timeout')), 15000);
    const onData = (d) => {
      if (d.toString().includes(String(PORT))) { clearTimeout(timer); resolve(proc); }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
  });
}

function analyzePair(restPath, hoverPath) {
  const out = execFileSync('python3', ['-c', `
import json, sys
from PIL import Image, ImageChops

ir = Image.open(sys.argv[1]).convert('RGB')
ih = Image.open(sys.argv[2]).convert('RGB')
w, h = ih.size
x0, y0, x1, y1 = int(w*0.15), int(h*0.15), int(w*0.85), int(h*0.85)
cr = ir.crop((x0, y0, x1, y1))
ch = ih.crop((x0, y0, x1, y1))
d = ImageChops.difference(cr, ch)
g_d = d.get_flattened_data() if hasattr(d, 'get_flattened_data') else d.getdata()
changed_pct = sum(1 for r,g,b in g_d if r+g+b > 15) * 100.0 / max(1, (x1-x0)*(y1-y0))

def flat_2d_tiles(img):
    px = img.load()
    cw, chh = img.size
    tiles = 0
    colors = set()
    STEP = 8
    for ty in range(0, chh - STEP, STEP):
        for tx in range(0, cw - STEP, STEP):
            c0 = px[tx, ty]
            same = True
            for dy in range(STEP):
                for dx in range(STEP):
                    p = px[tx+dx, ty+dy]
                    if abs(p[0]-c0[0]) + abs(p[1]-c0[1]) + abs(p[2]-c0[2]) > 2:
                        same = False
                        break
                if not same:
                    break
            if same:
                tiles += 1
                colors.add((c0[0]//4, c0[1]//4, c0[2]//4))
    return tiles, len(colors)

rt, rc = flat_2d_tiles(cr)
ht, hc = flat_2d_tiles(ch)
ext = ch.getextrema()
span = max(c[1]-c[0] for c in ext) if ext else 0
print(json.dumps({
    "changedPct": round(changed_pct, 2),
    "restFlatColors": rc,
    "hoverFlatColors": hc,
    "deltaFlatColors": hc - rc,
    "colorSpan": span
}))
`, restPath, hoverPath], { encoding: 'utf8' });
  return JSON.parse(out.trim());
}

function attachLoggers(page, errors, warnings) {
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') errors.push(t);
    else if (m.type() === 'warning' && /webgl|context|shader|texture/i.test(t)) warnings.push(t);
  });
  page.on('pageerror', (e) => errors.push(e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : e.message));
}

async function waitForLoaderDone(page, timeoutMs = 16000) {
  try {
    await page.waitForFunction(() => {
      const l = document.querySelector('.structure-loader');
      return !l || getComputedStyle(l).display === 'none' || parseFloat(getComputedStyle(l).opacity) === 0;
    }, null, { timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

async function waitForShowreelVisibleOpaque(page, timeoutMs = 6000) {
  try {
    await page.waitForFunction(() => {
      const el = document.querySelector('.sections-hero__videoPreview.start');
      if (!el) return false;
      const op = parseFloat(getComputedStyle(el).opacity);
      return op >= 0.85 && el.readyState >= 2 && el.getAttribute('data-distortion') === 'ready';
    }, null, { timeout: timeoutMs });
  } catch {}
}

async function waitForCaseStudyReady(page, timeoutMs = 8000) {
  try {
    await page.waitForFunction(() => {
      const card = document.querySelector('.parts-caseStudyCard');
      return card?.getAttribute('data-distortion') === 'ready';
    }, null, { timeout: timeoutMs });
  } catch {}
}

async function scrollToTopImmediate(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
  });
  await page.waitForTimeout(250);
}

async function navigateSpa(page, targetPath) {
  const deadline = Date.now() + 9000;
  while (Date.now() < deadline) {
    await page.evaluate((p) => document.querySelector(`header a[href="${p}"]`)?.click(), targetPath);
    try {
      await page.waitForFunction((p) => location.pathname === p, targetPath, { timeout: 700 });
      await page.waitForTimeout(1600);
      return;
    } catch {
      await page.waitForTimeout(250);
    }
  }
  throw new Error(`Failed SPA nav to ${targetPath}`);
}

async function popstateBack(page, expectedPath) {
  const deadline = Date.now() + 9000;
  while (Date.now() < deadline) {
    await page.evaluate(() => history.back());
    try {
      await page.waitForFunction((p) => location.pathname === p, expectedPath, { timeout: 1200 });
      await page.waitForTimeout(1600);
      return;
    } catch {
      await page.waitForTimeout(250);
    }
  }
  throw new Error(`Failed popstate back to ${expectedPath}`);
}

async function probeTarget(page, selector, type, shotPrefix, opts = {}) {
  if (type === 'video') {
    await scrollToTopImmediate(page);
    await waitForShowreelVisibleOpaque(page, opts.waitMs || 5000);
  } else {
    await page.evaluate(() => document.querySelector('.sections-caseStudies')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await waitForCaseStudyReady(page, opts.waitMs || 6000);
    // Let ScrollTrigger entrance tween settle cleanly so card sits in resting position during cursor sweep
    await page.waitForTimeout(350);
  }

  const box = await page.evaluate(async ({ selector, type, pauseVideo }) => {
    const el = document.querySelector(selector);
    if (!el) return { missing: true };
    if (type === 'video' && pauseVideo && el.readyState >= 2) {
      try {
        el.pause();
        if (Math.abs(el.currentTime - 0.75) > 0.08) {
          await new Promise((res) => {
            const done = () => { el.removeEventListener('seeked', done); res(); };
            el.addEventListener('seeked', done, { once: true });
            el.currentTime = 0.75;
            setTimeout(done, 1500);
          });
          await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
        }
      } catch {}
    }
    const host = el.closest('.parts-caseStudyCard') || el;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const fgCanvas = document.querySelectorAll('canvas.webgl')[0];
    return {
      rect: { x: Math.max(0, Math.floor(r.x)), y: Math.max(0, Math.floor(r.y)), width: Math.floor(r.width), height: Math.floor(r.height) },
      vis: cs.visibility,
      opacity: cs.opacity,
      hiddenFromDom: type === 'video' ? cs.visibility === 'hidden' : cs.opacity === '0',
      distState: host.getAttribute('data-distortion'),
      readyState: el.readyState ?? null,
      videoW: el.videoWidth ?? null,
      paused: el.paused ?? null,
      natW: el.naturalWidth ?? null,
      fgConnected: fgCanvas?.isConnected ?? false,
      fgSize: fgCanvas ? [fgCanvas.width, fgCanvas.height] : null,
      dpr: window.devicePixelRatio,
    };
  }, { selector, type, pauseVideo: opts.pauseVideo !== false });

  if (box.missing || box.rect.width < 120 || box.rect.height < 120 || box.rect.y + box.rect.height <= 0 || box.rect.y >= 900) {
    return { ok: false, reason: 'missing-or-clipped', box };
  }

  if (!opts.immediate) {
    await page.mouse.move(10, 10);
    await page.waitForTimeout(750);
  }
  const dir = opts.saveShotDir || `${TMP_OUT}/shots`;
  const restPath = `${dir}/${shotPrefix}-${type}-rest.png`;
  const hoverPath = `${dir}/${shotPrefix}-${type}-hover.png`;
  const clip = {
    x: box.rect.x,
    y: box.rect.y,
    width: Math.min(box.rect.width, 1440 - box.rect.x),
    height: Math.min(box.rect.height, 900 - box.rect.y),
  };
  await page.screenshot({ path: restPath, clip });

  const cx = clip.x + clip.width * 0.5;
  const cy = clip.y + clip.height * 0.5;
  await page.mouse.move(cx - 45, cy - 25);
  await page.mouse.move(cx, cy, { steps: 6 });
  await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res)))));
  await page.screenshot({ path: hoverPath, clip });

  const imgStats = analyzePair(restPath, hoverPath);
  if (!opts.keepShots) {
    try { fs.unlinkSync(restPath); fs.unlinkSync(hoverPath); } catch {}
  }

  const webglActive = Boolean(box.fgConnected && box.fgSize?.[0] > 0 && box.hiddenFromDom && box.distState === 'ready');
  const nonBlank = imgStats.colorSpan > 25;
  const distortionSeen = type === 'card'
    ? (imgStats.deltaFlatColors >= 8 || imgStats.hoverFlatColors >= 10)
    : (imgStats.deltaFlatColors >= 2 || (imgStats.hoverFlatColors >= 4 && imgStats.changedPct >= 2.0));
  const ok = webglActive && nonBlank && distortionSeen;
  return { ok, webglActive, nonBlank, distortionSeen, ...box, ...imgStats };
}

async function runScenario(name, count, concurrency, fn) {
  const results = new Array(count);
  let nextIdx = 0;
  let done = 0;
  async function worker() {
    while (true) {
      const i = nextIdx++;
      if (i >= count) break;
      results[i] = await fn(i);
      done++;
      if (done % 10 === 0 || done === count) console.log(`  [${name}] ${done}/${count}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, count) }, () => worker()));

  const sPass = results.filter((r) => r.showreel?.ok).length;
  const cPass = results.filter((r) => r.card0?.ok).length;
  const errCount = results.filter((r) => r.errors?.length > 0).length;
  const summary = {
    name,
    iterations: count,
    showreelPass: sPass,
    card0Pass: cPass,
    runsWithErrors: errCount,
    sampleErrors: [...new Set(results.flatMap((r) => r.errors || []))].slice(0, 5),
    showreelFailSample: results.find((r) => !r.showreel?.ok)?.showreel ?? null,
    card0FailSample: results.find((r) => !r.card0?.ok)?.card0 ?? null,
    extra: results.map((r) => r.extra).filter(Boolean).slice(0, 5),
  };
  console.log(`\n=== ${name} (${count} runs) ===\nShowreel: ${sPass}/${count} PASS | Card0: ${cPass}/${count} PASS | Errors: ${errCount}/${count}`);
  return summary;
}

const server = await startServer();
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
});

const report = {};

try {
  if (BATCH === 'ALL' || BATCH === 'A') {
    report.hardReload = await runScenario('S1a_Hard_Reload_NoCache', ITERS, 2, async (i) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await waitForLoaderDone(page);
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s1a-${i}`);
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s1a-${i}`);
      await ctx.close();
      return { showreel, card0, errors };
    });

    report.fast4gCpu4x = await runScenario('S2a_Fast4G_CPU4x', ITERS, 2, async (i) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        latency: 150,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const errors = [];
      attachLoggers(page, errors, []);
      const t0 = Date.now();
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForLoaderDone(page, 18000);
      const introMs = Date.now() - t0;
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s2a-${i}`, { waitMs: 14000 });
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s2a-${i}`, { waitMs: 12000 });
      await ctx.close();
      return { showreel, card0, errors, extra: { introMs } };
    });

    report.slow4gCpu4x = await runScenario('S2b_Slow4G_CPU4x', ITERS, 2, async (i) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (400 * 1024) / 8,
        uploadThroughput: (400 * 1024) / 8,
        latency: 400,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await waitForLoaderDone(page, 22000);
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s2b-${i}`, { waitMs: 25000 });
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s2b-${i}`, { waitMs: 25000 });
      await ctx.close();
      return { showreel, card0, errors };
    });

    report.resizeSmallToLarge = await runScenario('S4a_Load800_Resize1440', ITERS, 2, async (i) => {
      const ctx = await browser.newContext({ viewport: { width: 800, height: 700 } });
      const page = await ctx.newPage();
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(800);
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s4a-${i}`);
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s4a-${i}`);
      await ctx.close();
      return { showreel, card0, errors };
    });

    report.immediateHover = await runScenario('S5_ImmediateHover_And_PreIntro', ITERS, 1, async (i) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      await page.mouse.move(1050, 320, { steps: 3 });
      await waitForLoaderDone(page, 14000);
      const imm = await page.evaluate(() => {
        const v = document.querySelector('.sections-hero__videoPreview.start');
        const c = document.querySelector('.parts-caseStudyCard');
        return {
          startDist: v?.getAttribute('data-distortion'),
          cardDist: c?.getAttribute('data-distortion'),
          readyState: v?.readyState ?? 0,
        };
      });
      await page.mouse.move(1050, 320, { steps: 3 });
      const maxRafMs = await page.evaluate(() => new Promise((resolve) => {
        const times = [];
        const step = (ts) => {
          times.push(ts);
          if (times.length >= 12) {
            let maxD = 0;
            for (let k = 1; k < times.length; k++) maxD = Math.max(maxD, times[k] - times[k - 1]);
            resolve(Math.round(maxD * 10) / 10);
          } else {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      }));
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s5-${i}`);
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s5-${i}`);
      await ctx.close();
      return { showreel, card0, errors, extra: { ...imm, maxRafMs } };
    });
  }

  if (BATCH === 'ALL' || BATCH === 'B') {
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);
      report.warmReload = await runScenario('S1b_Warm_Reload', ITERS, 1, async (i) => {
        errors.length = 0;
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForLoaderDone(page);
        const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s1b-${i}`);
        const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s1b-${i}`);
        return { showreel, card0, errors: [...errors] };
      });
      await ctx.close();
    }

    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      attachLoggers(page, errors, []);
      await page.addInitScript(() => {
        const origGetCtx = HTMLCanvasElement.prototype.getContext;
        window.__glCtxCreated = 0;
        window.__glCtxLostCount = 0;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          const res = origGetCtx.call(this, type, ...args);
          if (res && (type === 'webgl' || type === 'webgl2')) {
            window.__glCtxCreated++;
            this.addEventListener('webglcontextlost', () => window.__glCtxLostCount++);
          }
          return res;
        };
      });
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);
      report.spaAndPopstate = await runScenario('S3_SPA_Nav_And_BrowserBack', ITERS, 1, async (i) => {
        errors.length = 0;
        await scrollToTopImmediate(page);
        await navigateSpa(page, '/about');
        await navigateSpa(page, '/');
        await navigateSpa(page, '/services');
        await popstateBack(page, '/');
        const glStats = await page.evaluate(() => ({ created: window.__glCtxCreated, lostEvents: window.__glCtxLostCount, canvases: document.querySelectorAll('canvas.webgl').length }));
        const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s3-${i}`);
        const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s3-${i}`);
        return { showreel, card0, errors: [...errors], extra: glStats };
      });
      await ctx.close();
    }

    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);

      report.resizeDprVisibility = await runScenario('S4b_Resize_DPR2_TabHideShow', ITERS, 1, async (i) => {
        errors.length = 0;
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 900, height: 700, deviceScaleFactor: 2, mobile: false });
        await cdp.send('Page.setWebLifecycleState', { state: 'frozen' }).catch(() => {});
        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
        await page.waitForTimeout(150);
        await cdp.send('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
        await page.evaluate(() => window.dispatchEvent(new Event('resize')));
        await page.waitForTimeout(450);
        const canvasDprCheck = await page.evaluate(() => {
          const fg = document.querySelectorAll('canvas.webgl')[0];
          return fg ? { cw: fg.width, clientW: fg.clientWidth, dpr: window.devicePixelRatio } : null;
        });
        const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s4b-${i}`);
        const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s4b-${i}`);
        return { showreel, card0, errors: [...errors], extra: canvasDprCheck };
      });
      await ctx.close();
    }

    report.videoDelayed = await runScenario('S6a_Video_Delayed_ReadyStateLt2', ITERS, 2, async (i) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      attachLoggers(page, errors, []);
      await page.route('**/*.mp4', async (route) => {
        await new Promise((r) => setTimeout(r, 4200));
        await route.continue().catch(() => {});
      });
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await waitForLoaderDone(page, 14000);
      // Verify plain fallback shows cleanly while delayed before upgrade
      const duringDelay = await page.evaluate(() => {
        const v = document.querySelector('.sections-hero__videoPreview.start');
        return v ? { vis: getComputedStyle(v).visibility, dist: v.getAttribute('data-distortion') } : null;
      });
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s6a-${i}`, { waitMs: 12000 });
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s6a-${i}`);
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await ctx.close();
      return { showreel, card0, errors, extra: duringDelay };
    });

    const blockedBrowser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--no-sandbox',
        '--autoplay-policy=document-user-activation-required',
      ],
    });
    try {
      report.videoAutoplayBlocked = await runScenario('S6b_Video_Autoplay_Paused_SPA', ITERS, 2, async (i) => {
        const ctx = await blockedBrowser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await ctx.newPage();
        const errors = [];
        attachLoggers(page, errors, []);
        await page.goto(BASE + '/', { waitUntil: 'load' });
        await waitForLoaderDone(page);
        await navigateSpa(page, '/services');
        await navigateSpa(page, '/');
        const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', `v-s6b-${i}`, { pauseVideo: true });
        const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', `v-s6b-${i}`);
        await ctx.close();
        return { showreel, card0, errors };
      });
    } finally {
      await blockedBrowser.close();
    }
  }

  if (BATCH === 'ALL' || BATCH === 'C') {
    const targeted = {};

    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      attachLoggers(page, errors, []);
      await page.addInitScript(() => {
        const origGetCtx = HTMLCanvasElement.prototype.getContext;
        window.__glCtxCreated = 0;
        window.__glCtxLostCount = 0;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          const res = origGetCtx.call(this, type, ...args);
          if (res && (type === 'webgl' || type === 'webgl2')) {
            window.__glCtxCreated++;
            this.addEventListener('webglcontextlost', () => window.__glCtxLostCount++);
          }
          return res;
        };
      });
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);
      const routeSeq = ['/about', '/services', '/contact', '/', '/about', '/services', '/contact', '/', '/services', '/'];
      for (const p of routeSeq) await navigateSpa(page, p);
      const glStats = await page.evaluate(() => ({
        created: window.__glCtxCreated,
        lost: window.__glCtxLostCount,
        canvasCount: document.querySelectorAll('canvas.webgl').length,
      }));
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', 'webgl-showreel', { keepShots: true, saveShotDir: SHOT_OUT });
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', 'webgl-card0', { keepShots: true, saveShotDir: SHOT_OUT });
      targeted.t1_tenSwaps = { glStats, showreelOk: showreel.ok, card0Ok: card0.ok, errors };
      await ctx.close();
    }

    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      attachLoggers(page, errors, []);
      await page.addInitScript(() => {
        window.__glContexts = [];
        const origGetCtx = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          const res = origGetCtx.call(this, type, ...args);
          if (res && (type === 'webgl' || type === 'webgl2')) window.__glContexts.push(res);
          return res;
        };
      });
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);
      await waitForShowreelVisibleOpaque(page);
      await page.evaluate(() => {
        window.__loseExts = window.__glContexts.map((gl) => gl.getExtension('WEBGL_lose_context')).filter(Boolean);
        window.__loseExts.forEach((ext) => ext.loseContext());
      });
      await page.waitForTimeout(300);
      const duringLoss = await page.evaluate(() => ({
        startDist: document.querySelector('.sections-hero__videoPreview.start')?.getAttribute('data-distortion'),
        startVis: getComputedStyle(document.querySelector('.sections-hero__videoPreview.start')).visibility,
        card0Dist: document.querySelector('.parts-caseStudyCard')?.getAttribute('data-distortion'),
        card0ImgOp: getComputedStyle(document.querySelector('.parts-caseStudyCard__image')).opacity,
      }));
      await page.evaluate(() => window.__loseExts.forEach((ext) => ext.restoreContext()));
      await page.waitForTimeout(600);
      const showreel = await probeTarget(page, '.sections-hero__videoPreview.start', 'video', 'v-t2');
      const card0 = await probeTarget(page, '.parts-caseStudySlider__slide img.parts-caseStudyCard__image', 'card', 'v-t2');
      targeted.t2_loseRestore = { duringLoss, restoredShowreelOk: showreel.ok, restoredCard0Ok: card0.ok, errors };
      await ctx.close();
    }

    {
      const noGlBrowser = await chromium.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--disable-webgl', '--disable-webgl2', '--no-sandbox'],
      });
      try {
        const ctx = await noGlBrowser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await ctx.newPage();
        const errors = [];
        attachLoggers(page, errors, []);
        await page.goto(BASE + '/', { waitUntil: 'load' });
        await waitForLoaderDone(page);
        await page.waitForTimeout(1800);
        const state = await page.evaluate(() => {
          const v = document.querySelector('.sections-hero__videoPreview.start');
          const c = document.querySelector('.parts-caseStudyCard');
          const img = c?.querySelector('img.parts-caseStudyCard__image');
          return {
            startDist: v?.getAttribute('data-distortion'),
            startVis: v ? getComputedStyle(v).visibility : null,
            cardDist: c?.getAttribute('data-distortion'),
            cardImgOp: img ? getComputedStyle(img).opacity : null,
          };
        });
        await page.screenshot({ path: `${SHOT_OUT}/webgl-fallback-nowebgl.png` });
        targeted.t3a_noWebGL = { state, errors };
        await ctx.close();
      } finally {
        await noGlBrowser.close();
      }
    }

    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const implRequests = [];
      page.on('request', (req) => { if (/impl\..*\.js/.test(req.url())) implRequests.push(req.url()); });
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await page.waitForTimeout(800);
      const state = await page.evaluate(() => ({
        startDist: document.querySelector('.sections-hero__videoPreview.start')?.getAttribute('data-distortion'),
        startVis: getComputedStyle(document.querySelector('.sections-hero__videoPreview.start')).visibility,
        cardDist: document.querySelector('.parts-caseStudyCard')?.getAttribute('data-distortion'),
      }));
      targeted.t3b_reducedMotion = { implRequests, state, errors };
      await ctx.close();
    }

    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      const page = await ctx.newPage();
      const implRequests = [];
      page.on('request', (req) => { if (/impl\..*\.js/.test(req.url())) implRequests.push(req.url()); });
      const errors = [];
      attachLoggers(page, errors, []);
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);
      targeted.t3c_mobileTouch = { implRequests, errors };
      await ctx.close();
    }

    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const implEvents = [];
      page.on('response', (res) => {
        if (/impl\..*\.js/.test(res.url())) implEvents.push({ status: res.status(), fromCache: res.fromServiceWorker(), url: res.url() });
      });
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await waitForLoaderDone(page);
      const firstPreload = await page.evaluate(() => ({
        hasModulepreloadLink: Boolean(document.querySelector('link[rel="modulepreload"][href*="impl."]')),
        navStartToImplFetchEnd: performance.getEntriesByType('resource').filter((e) => /impl\..*\.js/.test(e.name)).map((e) => Math.round(e.responseEnd)),
      }));
      await page.reload({ waitUntil: 'load' });
      await waitForLoaderDone(page);
      targeted.t4_preloadAndCache = { firstPreload, implEvents };
      await ctx.close();
    }

    report.targeted = targeted;
    console.log('\n=== Targeted Verification Checks ===\n', JSON.stringify(targeted, null, 2));
  }

  const suffix = BATCH === 'ALL' ? '' : `-${BATCH}`;
  fs.writeFileSync(`${TMP_OUT}/verify-after${suffix}.json`, JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  try { process.kill(-server.pid, 'SIGKILL'); } catch {}
}
process.exit(0);
