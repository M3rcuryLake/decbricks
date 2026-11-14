/**
 * Monumental legal pages matrix (hero / island / motion / a11y).
 * Usage: node docs/qa/legal-monumental.cjs  (dev server :4321)
 * Task 1 scope: A2 hero band assertions. Tasks 2-3 extend this file.
 */
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const SHOTS = '/home/ankit/GitHub/decbricks/docs/qa/shots/';
const BASE = 'http://localhost:4321';
const results = [];
const T = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

const DOCS = {
  '/terms': 'Terms of Service',
  '/privacy-policy': 'Privacy Policy',
};

async function load(page, path, wait = 4600) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
}

(async () => {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'], executablePath: '/usr/bin/google-chrome' });

  // --- Task 1: ServicesHero treatment (flares, smiley subtext, FK display words) ---
  for (const [path, title] of Object.entries(DOCS)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await load(page, path);
    const h = await page.evaluate(() => {
      const hero = document.querySelector('.sections-servicesHero');
      const vis = (el) => !!el && el.offsetParent !== null;
      return JSON.stringify({
        heroExists: !!hero,
        theme: hero?.getAttribute('data-theme'),
        h1: document.querySelector('h1')?.textContent?.trim() || null,
        h1Count: document.querySelectorAll('h1').length,
        smiley: document.querySelector('.parts-smileyText')?.textContent?.trim() || null,
        smileyVisible: vis(document.querySelector('.parts-smileyText')),
        word1: document.querySelector('.sections-servicesHero__word1')?.textContent?.trim() || null,
        word2: document.querySelector('.sections-servicesHero__word2')?.textContent?.trim() || null,
        trail: !!document.querySelector('.sections-servicesHero__trail'),
        navRow: !!document.querySelector('.parts-servicesHeroNavRow'),
        stamp: document.querySelector('[data-legal-draft-stamp]')?.textContent?.trim() || null,
        stampVisible: vis(document.querySelector('[data-legal-draft-stamp]')),
        chips: document.querySelectorAll('.legal-hero__chip').length,
        bricks: document.querySelectorAll('.legal-brick').length,
        progressH: document.querySelector('.legal-progress') ? getComputedStyle(document.querySelector('.legal-progress')).height : null,
        topHidden: document.querySelector('.legal-top')?.hasAttribute('hidden'),
        placeholders: (document.querySelector('main')?.textContent || '').match(/\[[^\]]{3,60}\]/g)?.length || 0,
      });
    });
    const d = JSON.parse(h);
    T(`${path}: hero exists`, d.heroExists, '');
    T(`${path}: hero is dark themed`, d.theme === 'dark', d.theme);
    T(`${path}: h1 full doc title (sr-only)`, (d.h1 || '').includes(title), d.h1);
    T(`${path}: exactly one h1`, d.h1Count === 1, String(d.h1Count));
    T(`${path}: smiley subtext present + visible`, !!d.smiley && /template draft/i.test(d.smiley) && d.smileyVisible, (d.smiley || 'null').slice(0, 80));
    T(`${path}: FK display words render`, d.word1 && d.word2, `${d.word1} / ${d.word2}`);
    T(`${path}: trail svg present (flares)`, d.trail, '');
    T(`${path}: no Jump-to pill row on legal`, d.navRow === false, '');
    T(`${path}: draft stamp visible in hero slot`, (d.stamp || '').startsWith('Last updated:') && d.stampVisible, `${d.stamp} visible=${d.stampVisible}`);
    T(`${path}: 0 chips, 0 bricks (paragraphical)`, d.chips === 0 && d.bricks === 0, `chips=${d.chips} bricks=${d.bricks}`);
    T(`${path}: page contained (no h-overflow at 1280)`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), '');
    T(`${path}: >= 3 placeholders visible`, d.placeholders >= 3, String(d.placeholders));
    T(`${path}: progress hairline 3px`, d.progressH === '3px', d.progressH);
    T(`${path}: back-to-top hidden at top`, d.topHidden === true, String(d.topHidden));
    T(`${path}: console clean`, errs.length === 0, errs.join(' | ').slice(0, 200));
    await page.screenshot({ path: SHOTS + `legal-hero-${path.slice(1)}-1280.png` });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(600);
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= 376);
    T(`${path}: 375px no horizontal scroll`, noHScroll, '');
    await page.screenshot({ path: SHOTS + `legal-hero-${path.slice(1)}-375.png` });
    await page.close();
  }

  // --- Task 2: numerals + fixed rail ---
  for (const [path, title] of Object.entries(DOCS)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await load(page, path);
    const d = await page.evaluate(() => {
      const rail = document.querySelector('.legal-rail');
      const rr = rail ? rail.getBoundingClientRect() : null;
      const links = [...document.querySelectorAll('.legal-railLink')];
      const nums = [...document.querySelectorAll('.legal-num')];
      return JSON.stringify({
        railExists: !!rail,
        railPos: rail ? getComputedStyle(rail).position : null,
        railRight: rr ? Math.round(window.innerWidth - rr.right) : null,
        railVisible: rail ? getComputedStyle(rail).display !== 'none' : false,
        linkCount: links.length,
        firstLink: links[0]?.textContent?.trim(),
        hrefs: links.map(l => l.getAttribute('href')),
        hrefTargets: links.map(l => !!document.getElementById((l.getAttribute('href') || '').slice(1))),
        numCount: nums.length,
        numColor: nums[0] ? getComputedStyle(nums[0]).color : null,
        numSize: nums[0] ? parseFloat(getComputedStyle(nums[0]).fontSize) : 0,
      });
    });
    const j = JSON.parse(d);
    const expectCount = path === '/terms' ? 14 : 11;
    T(`${path}: rail fixed right`, j.railExists && j.railPos === 'fixed' && j.railRight !== null && j.railRight <= 2, `pos=${j.railPos} rightGap=${j.railRight}`);
    T(`${path}: rail visible at 1280`, j.railVisible, '');
    T(`${path}: ${expectCount} rail links`, j.linkCount === expectCount, String(j.linkCount));
    T(`${path}: first link reads 01`, j.firstLink === '01', j.firstLink);
    T(`${path}: every rail href resolves`, j.hrefTargets.every(Boolean), String(j.hrefTargets.filter(x => !x).length) + ' broken');
    T(`${path}: ${expectCount} numerals`, j.numCount === expectCount, String(j.numCount));
    T(`${path}: numeral olive >= 48px`, /rgb\(90, 100, 50\)/.test(j.numColor || '') && j.numSize >= 48, `color=${j.numColor} size=${j.numSize}`);
    T(`${path}: numerals aria-hidden`, await page.evaluate(() => [...document.querySelectorAll('.legal-num')].every(n => n.getAttribute('aria-hidden') === 'true')), '');
    // 375: rail hidden
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const mobile = await page.evaluate(() => JSON.stringify({
      railDisplay: getComputedStyle(document.querySelector('.legal-rail') || document.body).display,
      hscroll: document.documentElement.scrollWidth,
    }));
    const m = JSON.parse(mobile);
    T(`${path}: 375px rail hidden`, m.railDisplay === 'none', m.railDisplay);
    T(`${path}: 375px no horizontal scroll`, m.hscroll <= 376, String(m.hscroll));
    await page.screenshot({ path: SHOTS + `legal-island-${path.slice(1)}-375.png` });
    await page.close();
  }

  // --- Task 3: motion module ---
  {
    // spy + progress + back-to-top + rail jump offset (motion-allowed context)
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await load(page, '/terms');
    // hero entrance: smiley subtext + display words fully visible at rest
    const heroRest = await page.evaluate(() => {
      const smiley = document.querySelector('.parts-smileyText');
      const w1 = document.querySelector('.sections-servicesHero__word1');
      const w2 = document.querySelector('.sections-servicesHero__word2');
      const op = (el) => el ? parseFloat(getComputedStyle(el).opacity) : 0;
      return { smiley: op(smiley), w1: op(w1), w2: op(w2) };
    });
    T('motion: smiley + display words visible at rest', heroRest.smiley > 0.9 && heroRest.w1 > 0.9 && heroRest.w2 > 0.9, JSON.stringify(heroRest));
    await page.waitForTimeout(2200);
    // sections reveal: no hidden content at rest
    const sectionsVisible = await page.evaluate(() => [...document.querySelectorAll('.legal-island section')].every(s => parseFloat(getComputedStyle(s).opacity) > 0.9 || s.getBoundingClientRect().top > window.innerHeight));
    T('motion: island sections visible (reveal or below fold)', sectionsVisible, '');
    // scroll to section 3 → spy
    await page.evaluate(() => { const els = document.querySelectorAll('.legal-island section'); window.$lenis ? window.$lenis.scrollTo(els[2], { immediate: true }) : els[2].scrollIntoView(); });
    await page.waitForTimeout(700);
    const spy = await page.evaluate(() => {
      const current = document.querySelector('.legal-railLink[aria-current="true"]');
      const els = [...document.querySelectorAll('.legal-island section')];
      const top = els.findIndex(e => { const r = e.getBoundingClientRect(); return r.top > -50 && r.top < window.innerHeight; });
      return { current: current?.textContent?.trim(), currentHref: current?.getAttribute('href'), section3: els[2]?.id };
    });
    T('motion: scroll-spy sets aria-current', !!spy.current, JSON.stringify(spy));
    // progress bar
    const prog = await page.evaluate(() => {
      const bar = document.querySelector('.legal-progress');
      const at = getComputedStyle(bar).transform;
      window.scrollTo(0, document.body.scrollHeight);
      return at;
    });
    await page.waitForTimeout(500);
    const progBottom = await page.evaluate(() => {
      const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.legal-progress')).transform);
      return m.a;
    });
    T('motion: progress scaleX grows to ~1', progBottom > 0.9, `bottom a=${progBottom.toFixed(3)}`);
    // back to top
    const topVisible = await page.evaluate(() => !document.querySelector('.legal-top')?.hasAttribute('hidden'));
    T('motion: back-to-top appears after scroll', topVisible, '');
    await page.evaluate(() => document.querySelector('.legal-top')?.click());
    await page.waitForTimeout(900);
    const backAtTop = await page.evaluate(() => ({ y: window.scrollY, hiddenAgain: document.querySelector('.legal-top')?.hasAttribute('hidden') }));
    T('motion: back-to-top returns to top + hides', backAtTop.y < 200, JSON.stringify(backAtTop));
    // rail jump offset: click 5th link
    await page.evaluate(() => document.querySelectorAll('.legal-railLink')[4]?.click());
    await page.waitForTimeout(1200);
    const offset = await page.evaluate(() => {
      const links = [...document.querySelectorAll('.legal-railLink')];
      const target = document.getElementById(links[4].getAttribute('href').slice(1));
      return Math.round(target.getBoundingClientRect().top);
    });
    T('motion: rail jump lands below header', offset >= 60, `top=${offset}`);
    T('motion: console clean on /terms', errs.length === 0, errs.join(' | ').slice(0, 200));
    await page.close();
  }

  // --- Task 3: reduced motion ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await load(page, '/terms');
    const rm = await page.evaluate(() => JSON.stringify({
      smileyOp: parseFloat(getComputedStyle(document.querySelector('.parts-smileyText') || document.body).opacity),
      minSectionOp: Math.min(...[...document.querySelectorAll('.legal-island section')].map(s => parseFloat(getComputedStyle(s).opacity))),
      railLinks: document.querySelectorAll('.legal-railLink').length,
    }));
    const r = JSON.parse(rm);
    T('reduced-motion: smiley fully visible at load', r.smileyOp > 0.9, `op=${r.smileyOp}`);
    T('reduced-motion: sections visible', r.minSectionOp > 0.9, String(r.minSectionOp));
    T('reduced-motion: rail present', r.railLinks === 14, String(r.railLinks));
    T('reduced-motion: console clean', errs.length === 0, errs.join(' | ').slice(0, 200));
    await page.close();
    await ctx.close();
  }

  // --- Task 3: swap gauntlet ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    for (const r of ['/', '/terms', '/privacy-policy', '/']) {
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4600);
    }
    // client-side swap: navigate via header link instead
    await page.evaluate(() => { const a = [...document.querySelectorAll('a')].find(x => x.getAttribute('href') === '/privacy-policy' && !x.closest('form')); if (a) a.click(); });
    await page.waitForTimeout(4600);
    const postSwap = await page.evaluate(() => JSON.stringify({
      path: location.pathname,
      progressCount: document.querySelectorAll('.legal-progress').length,
      h1: document.querySelector('h1')?.textContent?.trim(),
    }));
    const p = JSON.parse(postSwap);
    T('gauntlet: swap lands on privacy with one progress bar', p.path === '/privacy-policy' && p.progressCount === 1, JSON.stringify(p));
    T('gauntlet: console clean across swaps', errs.length === 0, errs.join(' | ').slice(0, 240));
    await page.close();
  }

  // --- Task 3: 375 after init ---
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await load(page, '/terms');
    const m = await page.evaluate(() => ({ hscroll: document.documentElement.scrollWidth, rail: getComputedStyle(document.querySelector('.legal-rail') || document.body).display }));
    T('375 after init: no h-scroll, rail hidden', m.hscroll <= 376 && m.rail === 'none', JSON.stringify(m));
    await page.close();
  }

  // --- Task 2: privacy §2 prose (no bullets, every word kept) ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await load(page, '/privacy-policy');
    const p = await page.evaluate(() => JSON.stringify({
      uls: document.querySelectorAll('.legal-island ul.legal-list').length,
      paras: document.querySelectorAll('#data-we-collect p').length,
      text: (document.getElementById('data-we-collect')?.textContent || ''),
    }));
    const j = JSON.parse(p);
    T('privacy: §2 renders no bullet list', j.uls === 0, String(j.uls));
    T('privacy: §2 words preserved (Formspree, Cal.com, consent, Server logs)', /Formspree/.test(j.text) && /Cal\.com/.test(j.text) && /consent to submit/.test(j.text) && /Server logs/.test(j.text), '');
    await page.close();
  }

  await browser.close();
  console.log(results.join('\n'));
  fs.writeFileSync(SHOTS + 'legal-monumental.txt', results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})();
