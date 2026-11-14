/**
 * Legal pages (/terms, /privacy-policy) + wiring matrix.
 * Usage: node docs/qa/legal-pages.cjs  (dev server :4321)
 * Task 3 (pages) + Task 4 (footer + label links) assertions.
 */
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const SHOTS = '/home/ankit/GitHub/decbricks/docs/qa/shots/';
const BASE = 'http://localhost:4321';
const results = [];
const T = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

async function load(page, path, wait = 4600) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
}

(async () => {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'], executablePath: '/usr/bin/google-chrome' });

  for (const [path, title] of [['/terms', 'Terms of Service'], ['/privacy-policy', 'Privacy Policy']]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await load(page, path);
    const info = await page.evaluate(() => JSON.stringify({
      h1: document.querySelectorAll('h1').length,
      h1Text: document.querySelector('h1')?.textContent?.trim(),
      h2s: document.querySelectorAll('main h2').length,
      bodyText: document.querySelector('main')?.textContent?.length || 0,
      placeholders: (document.querySelector('main')?.textContent || '').match(/\[[^\]]{3,60}\]/)?.slice(0, 3),
      robots: document.querySelector('meta[name="robots"]')?.content || null,
      title: document.title,
      formCheckboxes: document.querySelectorAll('form.sections-contactForm__form').length,
    }));
    const d = JSON.parse(info);
    T(`${path}: page exists (not 404)`, d.h1 > 0 && d.bodyText > 200, `title="${d.title}"`);
    T(`${path}: exactly one H1`, d.h1 === 1, String(d.h1));
    T(`${path}: H1 mentions "${title}"`, (d.h1Text || '').includes(title), d.h1Text);
    T(`${path}: has H2 sections`, d.h2s >= 5, String(d.h2s));
    T(`${path}: template placeholders visible`, (d.placeholders || []).length > 0, JSON.stringify(d.placeholders));
    T(`${path}: noindex while draft`, /noindex/.test(d.robots || ''), d.robots);
    T(`${path}: no contact form embedded`, d.formCheckboxes === 0, String(d.formCheckboxes));
    T(`${path}: console clean`, errs.length === 0, errs.join(' | ').slice(0, 200));
    // footer legal links point at the pages
    const footerLinks = await page.evaluate(() => [...document.querySelectorAll('a')].filter(a => /\/(terms|privacy-policy)/.test(a.getAttribute('href') || '')).map(a => a.getAttribute('href')));
    T(`${path}: footer/label links present`, footerLinks.filter(h => h === '/terms').length > 0 && footerLinks.filter(h => h === '/privacy-policy').length > 0, footerLinks.join(','));
    await page.screenshot({ path: SHOTS + `legal-${path.slice(1)}-1280.png` });
    // 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(600);
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > 376);
    T(`${path}: 375px no horizontal scroll`, !hscroll, '');
    await page.screenshot({ path: SHOTS + `legal-${path.slice(1)}-375.png` });
    await page.close();
  }

  // --- contact form label links (Task 4) ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await load(page, '/contact');
    const labelLinks = await page.evaluate(() => [...document.querySelectorAll('.parts-formCheckbox__label a')].map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), text: a.textContent?.trim() })));
    T('contact label: two legal links', labelLinks.length === 2, JSON.stringify(labelLinks));
    T('contact label: /terms link', labelLinks.some(l => l.href === '/terms'), '');
    T('contact label: /privacy-policy link', labelLinks.some(l => l.href === '/privacy-policy'), '');
    T('contact label: target=_blank', labelLinks.every(l => l.target === '_blank'), '');
    // clicking a link inside the label must NOT toggle the checkbox
    await page.evaluate(() => document.querySelector('.parts-formCheckbox__label a')?.click());
    await page.waitForTimeout(300);
    const onNewPage = await page.evaluate(() => ({ path: location.pathname, checked: document.querySelector('#terms')?.checked ?? null }));
    T('contact label: link click does not toggle checkbox', onNewPage.checked !== true, JSON.stringify(onNewPage));
    await page.close();
  }

  // --- footer legal links enabled (Task 4) ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await load(page, '/');
    const footer = await page.evaluate(() => JSON.stringify({
      privacy: !!document.querySelector('footer a[href="/privacy-policy"], .structure-footer a[href="/privacy-policy"]'),
      terms: !!document.querySelector('footer a[href="/terms"], .structure-footer a[href="/terms"]'),
    }));
    const f = JSON.parse(footer);
    T('footer: Privacy link enabled', f.privacy, '');
    T('footer: Terms link enabled', f.terms, '');
    await page.close();
  }

  // --- gauntlet incl. legal pages ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
    page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
    let reqCount = 0;
    await page.route('https://formspree.io/**', async r => { reqCount++; await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
    for (const r of ['/', '/about', '/services', '/contact', '/terms', '/privacy-policy', '/contact']) {
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4600);
    }
    await page.evaluate(() => window.$lenis?.scrollTo(999999, { immediate: true }));
    await page.waitForTimeout(400);
    await page.fill('#email', 'jane.doe@example.com');
    await page.fill('#name', 'Jane Doe');
    await page.fill('#company', 'Example Ltd');
    await page.fill('#message', 'Legal gauntlet.');
    await page.evaluate(() => document.querySelector('#terms')?.click());
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('sent'), null, { timeout: 6000 });
    T('gauntlet: form submits after legal-page swaps', reqCount === 1, String(reqCount));
    T('gauntlet: console clean', errs.length === 0, errs.join(' | ').slice(0, 200));
    await page.close();
  }

  await browser.close();
  console.log(results.join('\n'));
  fs.writeFileSync(SHOTS + 'legal-pages.txt', results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})();
