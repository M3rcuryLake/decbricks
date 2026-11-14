/**
 * Contact form tick checkbox matrix (mocked network).
 * Usage: node docs/qa/contact-tick.cjs  (dev server :4321)
 * RED baseline: fails while `.parts-formCheckbox svg` does not exist.
 */
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const SHOTS = '/home/ankit/GitHub/decbricks/docs/qa/shots/';
const BASE = 'http://localhost:4321';
const results = [];
const T = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

async function gotoContact(page) {
  await page.goto(BASE + '/contact', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form.sections-contactForm__form', { state: 'visible' });
  await page.waitForTimeout(4600);
}
const tick = (page) =>
  page.evaluate(() => {
    const wrapper = document.querySelector('form.sections-contactForm__form .parts-formCheckbox');
    const svg = wrapper?.querySelector('svg');
    if (!svg) return null;
    return getComputedStyle(svg).opacity;
  });
// the tick uses transition-opacity duration-300 — wait out the transition
const settle = (page) => page.waitForTimeout(450);

(async () => {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'], executablePath: '/usr/bin/google-chrome' });

  // --- tick toggles via click ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let reqCount = 0;
    await page.route('https://formspree.io/**', async r => { reqCount++; await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
    await gotoContact(page);
    const svgExists = await page.evaluate(() => !!document.querySelector('form.sections-contactForm__form .parts-formCheckbox svg'));
    T('tick: svg exists in markup', svgExists, String(svgExists));
    const before = await tick(page);
    T('tick: hidden when unchecked', before !== null && parseFloat(before) < 0.1, `opacity=${before}`);
    // click the visible box div
    await page.evaluate(() => document.querySelector('.parts-formCheckbox input[type="checkbox"]')?.click());
    await settle(page);
    const after = await tick(page);
    const checked = await page.isChecked('#terms');
    T('tick: visible when checked', after !== null && parseFloat(after) > 0.5, `opacity=${after} checked=${checked}`);
    // keyboard: Space toggles off then on
    await page.focus('#terms');
    await page.keyboard.press('Space');
    await settle(page);
    const off = await tick(page);
    T('tick: Space hides again', off !== null && parseFloat(off) < 0.1, `opacity=${off}`);
    await page.keyboard.press('Space');
    await settle(page);
    const on = await tick(page);
    T('tick: Space shows again', on !== null && parseFloat(on) > 0.5, `opacity=${on}`);
    await page.screenshot({ path: SHOTS + 'contact-tick-1280.png' });
    // label click (label is for=terms) — untick via label
    await page.evaluate(() => document.querySelector('.parts-formCheckbox__label')?.click());
    await settle(page);
    const viaLabel = await tick(page);
    T('tick: label click untoggles', viaLabel !== null && parseFloat(viaLabel) < 0.1, `opacity=${viaLabel}`);
    // re-check for the submit tests
    await page.evaluate(() => document.querySelector('#terms')?.click());
    // fill and submit → success hides the tick (reset path)
    await page.fill('#email', 'jane.doe@example.com');
    await page.fill('#name', 'Jane Doe');
    await page.fill('#company', 'Example Ltd');
    await page.fill('#message', 'Tick test.');
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('sent'), null, { timeout: 5000 });
    await settle(page);
    const afterSubmit = await tick(page);
    T('tick: hidden after successful submit (form reset)', afterSubmit !== null && parseFloat(afterSubmit) < 0.1, `opacity=${afterSubmit}`);
    T('tick: success produced 1 request', reqCount === 1, String(reqCount));
    // validation regression: terms unchecked + submit → inline error
    await page.fill('#email', 'jane.doe@example.com');
    await page.fill('#name', 'Jane Doe');
    await page.fill('#company', 'Example Ltd');
    await page.fill('#message', 'Tick test 2.');
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => !document.querySelector('#terms-error')?.hidden, null, { timeout: 5000 });
    T('tick: validation path intact (terms-error)', true, '');
    await page.close();
  }

  // --- 375px layout ---
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await gotoContact(page);
    await page.evaluate(() => { window.$lenis?.scrollTo(999999, { immediate: true }); });
    await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelector('#terms')?.click());
    await settle(page);
    const boxVisible = await page.evaluate(() => {
      const svg = document.querySelector('form.sections-contactForm__form .parts-formCheckbox svg');
      if (!svg) return false;
      const r = svg.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && parseFloat(getComputedStyle(svg).opacity) > 0.5;
    });
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= 376);
    T('tick: 375px visible in box', boxVisible, '');
    T('tick: 375px no horizontal scroll', noHScroll, '');
    await page.screenshot({ path: SHOTS + 'contact-tick-375.png' });
    await page.close();
  }

  // --- keyboard focus ring on the checkbox box (a11y) ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await gotoContact(page);
    // keyboard-only focus: no mouse click, so :focus-visible applies
    await page.evaluate(() => document.querySelector('#terms')?.focus());
    await page.keyboard.press('Space'); // ensure keyboard interaction path
    await page.focus('#terms');
    await page.waitForTimeout(100);
    const ring = await page.evaluate(() => {
      const box = document.querySelector('form.sections-contactForm__form .parts-formCheckbox input + div');
      if (!box) return null;
      const cs = getComputedStyle(box);
      return { outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, boxShadow: cs.boxShadow !== 'none', border: cs.borderColor };
    });
    T('tick: keyboard focus shows visible ring on box', !!ring && (ring.outlineStyle !== 'none' || ring.boxShadow), JSON.stringify(ring));
    await page.close();
  }

  await browser.close();
  console.log(results.join('\n'));
  fs.writeFileSync(SHOTS + 'contact-tick.txt', results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})();
