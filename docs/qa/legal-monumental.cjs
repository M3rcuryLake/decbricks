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

  // --- Task 1: hero band ---
  for (const [path, title] of Object.entries(DOCS)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await load(page, path);
    const h = await page.evaluate(() => {
      const hero = document.querySelector('.legal-hero');
      const r = (el) => el ? el.getBoundingClientRect() : null;
      return JSON.stringify({
        heroExists: !!hero,
        theme: hero?.getAttribute('data-theme'),
        heroBg: hero ? getComputedStyle(hero).backgroundImage + getComputedStyle(hero).backgroundColor : null,
        title: document.querySelector('h1.legal-hero__title')?.textContent?.trim() || null,
        h1Count: document.querySelectorAll('h1').length,
        stamp: document.querySelector('.legal-hero__stamp')?.textContent?.trim() || null,
        chips: [...document.querySelectorAll('.legal-hero__chip')].map(c => c.textContent.trim()),
        wallBricks: document.querySelectorAll('.legal-hero__wall .legal-brick').length,
        progressH: document.querySelector('.legal-progress') ? getComputedStyle(document.querySelector('.legal-progress')).height : null,
        topHidden: document.querySelector('.legal-top')?.hasAttribute('hidden'),
        placeholders: (document.querySelector('main')?.textContent || '').match(/\[[^\]]{3,60}\]/g)?.length || 0,
      });
    });
    const d = JSON.parse(h);
    T(`${path}: hero exists`, d.heroExists, '');
    T(`${path}: hero is dark themed`, d.theme === 'dark', d.theme);
    T(`${path}: hero bg burgundy family`, /128, 0, 32|800020/i.test(d.heroBg || ''), (d.heroBg || '').slice(0, 90));
    T(`${path}: h1 full doc title in hero`, (d.title || '').includes(title), d.title);
    T(`${path}: exactly one h1`, d.h1Count === 1, String(d.h1Count));
    T(`${path}: draft stamp visible`, (d.stamp || '').startsWith('Last updated:'), d.stamp);
    T(`${path}: 3 chips (sections/min read/Draft)`, d.chips.length === 3 && d.chips.some(c => /sections/.test(c)) && d.chips.some(c => /min read/.test(c)) && d.chips.some(c => /Draft/.test(c)), JSON.stringify(d.chips));
    T(`${path}: wall has >= 20 bricks`, d.wallBricks >= 20, String(d.wallBricks));
    // wall is clipped by the hero's overflow-hidden; what matters is that the
    // clipped decoration never scrolls the PAGE (both viewports assert this)
    const wallIn = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    T(`${path}: wall contained (no hero overflow)`, wallIn, '');
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

  await browser.close();
  console.log(results.join('\n'));
  fs.writeFileSync(SHOTS + 'legal-monumental.txt', results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})();
