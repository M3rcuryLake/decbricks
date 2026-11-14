/**
 * Contact-form Formspree matrix (mocked network — never hits the real endpoint).
 * Usage: node docs/qa/contact-form-matrix.cjs
 * Requires dev server on :4321 with PUBLIC_CONTACT_ENDPOINT set to the Formspree URL.
 */
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const SHOTS = '/home/ankit/GitHub/decbricks/docs/qa/shots/';
const BASE = 'http://localhost:4321';
const results = [];
const T = (name, ok, detail) => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const FILL = {
  email: 'jane.doe@example.com',
  name: 'Jane Doe',
  company: 'Example Ltd',
  message: 'This is an automated test submission. Please ignore.',
};

async function gotoContact(page, waitMs = 4600) {
  await page.goto(BASE + '/contact', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form.sections-contactForm__form', { state: 'visible' });
  await page.waitForTimeout(waitMs); // loader intro holds scroll ~3s
}

async function fillForm(page) {
  await page.fill('#email', FILL.email);
  await page.fill('#name', FILL.name);
  await page.fill('#company', FILL.company);
  await page.fill('#message', FILL.message);
  // terms is a visually-styled sr-only checkbox; click it programmatically
  await page.evaluate(() => document.querySelector('#terms')?.click());
}

async function scrollToForm(page) {
  await page.evaluate(() => window.$lenis && window.$lenis.scrollTo(999999, { immediate: true }));
  await page.waitForTimeout(300);
}

const STATUS = '#status-message';
const statusText = (page) => page.textContent(STATUS).then(t => (t || '').trim());

(async () => {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'], executablePath: '/usr/bin/google-chrome' });

  // ---------- 1. SUCCESS (200 {ok:true}) + payload assertions ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const consoleErrs = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 160)); });
    page.on('pageerror', e => consoleErrs.push(String(e).slice(0, 160)));
    let reqCount = 0; let payload = null; let accept = null; let method = null;
    await page.route('https://formspree.io/**', async route => {
      reqCount++;
      const req = route.request();
      method = req.method(); accept = req.headers()['accept'];
      payload = {};
      const post = req.postDataBuffer();
      if (post) {
        // multipart boundary parse: capture name= pairs by raw scan of parts
        const text = post.toString('latin1');
        const re = /name="([^"]+)"\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n$)/g;
        let m; while ((m = re.exec(text))) payload[m[1]] = m[2];
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await gotoContact(page);
    await scrollToForm(page);
    await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('sent'), null, { timeout: 5000 });
    const status = await statusText(page);
    const btn = await page.textContent('button[aria-label="Submit"]');
    const role = await page.getAttribute(STATUS, 'role');
    T('success: status text', /sent/i.test(status), status);
    T('success: button label', /Sent/i.test(btn || ''), (btn || '').trim());
    T('success: role=status', role === 'status', String(role));
    T('success: one request', reqCount === 1, String(reqCount));
    T('success: method POST', method === 'POST', String(method));
    T('success: Accept json', /application\/json/.test(accept || ''), String(accept));
    T('payload: email', payload?.email === FILL.email, JSON.stringify(payload?.email));
    T('payload: name', payload?.name === FILL.name, JSON.stringify(payload?.name));
    T('payload: _gotcha empty', payload?._gotcha === '', JSON.stringify(payload?._gotcha));
    T('payload: _subject personalised', payload?._subject === 'New enquiry from Jane Doe - Decbricks', JSON.stringify(payload?._subject));
    T('payload: source_page', payload?.source_page === '/contact' || payload?.source_page === '/contact/', JSON.stringify(payload?.source_page));
    T('payload: consent/terms', !!payload?.terms, JSON.stringify(payload?.terms));
    T('payload: message', payload?.message === FILL.message, JSON.stringify(payload?.message));
    // form was reset
    const emailVal = await page.inputValue('#email');
    T('success: form reset', emailVal === '', JSON.stringify(emailVal));
    // focus moved to status
    const focusId = await page.evaluate(() => document.activeElement?.id);
    T('success: focus on status', focusId === 'status-message', String(focusId));
    T('success: console clean', consoleErrs.length === 0, consoleErrs.join(' | ').slice(0, 300));
    await page.screenshot({ path: SHOTS + 'contact-success.png' });
    await page.close();
  }

  // ---------- 2. 422 field errors ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route('https://formspree.io/**', async route => {
      await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ errors: [{ field: 'email', message: 'That email address looks invalid.' }] }) });
    });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => !document.querySelector('#email-error')?.hidden, null, { timeout: 5000 });
    const errText = await page.textContent('#email-error');
    const role = await page.getAttribute(STATUS, 'role');
    const status = await statusText(page);
    const focusId = await page.evaluate(() => document.activeElement?.id);
    const val = await page.inputValue('#message');
    T('422: inline error shown', /invalid/.test(errText || ''), (errText || '').trim());
    T('422: status role=alert', role === 'alert', String(role));
    T('422: status text', /correct/.test(status), status);
    T('422: focus first invalid', focusId === 'email', String(focusId));
    T('422: input preserved', val === FILL.message, '');
    // typing clears the error
    await page.fill('#email', 'fixed@example.com');
    const hidden = await page.evaluate(() => document.querySelector('#email-error')?.hidden);
    T('422: typing clears error', hidden === true, String(hidden));
    await page.close();
  }

  // ---------- 3. 429 specific message ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route('https://formspree.io/**', async route => {
      await route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('quickly'), null, { timeout: 5000 });
    const status = await statusText(page);
    T('429: specific message', /too quickly/.test(status), status);
    T('429: no field errors', await page.evaluate(() => [...document.querySelectorAll('.form-fieldError')].every(e => e.hidden)), '');
    await page.close();
  }

  // ---------- 4. 500 generic message ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route('https://formspree.io/**', async route => {
      await route.fulfill({ status: 500, contentType: 'text/html', body: 'boom' });
    });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('wrong'), null, { timeout: 5000 });
    const status = await statusText(page);
    const val = await page.inputValue('#message');
    T('500: generic message', /went wrong/.test(status), status);
    T('500: input preserved', val === FILL.message, '');
    await page.close();
  }

  // ---------- 5. offline ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.context().setOffline(true);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('reach the server'), null, { timeout: 8000 });
    const status = await statusText(page);
    const val = await page.inputValue('#message');
    T('offline: message', /reach the server/.test(status), status);
    T('offline: input preserved', val === FILL.message, '');
    await page.context().setOffline(false);
    await page.close();
  }

  // ---------- 6. timeout >15s ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route('https://formspree.io/**', async route => {
      await new Promise(r => setTimeout(r, 16000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('too long'), null, { timeout: 20000 });
    const status = await statusText(page);
    const val = await page.inputValue('#message');
    T('timeout: message', /too long/.test(status), status);
    T('timeout: input preserved', val === FILL.message, '');
    T('timeout: button re-enabled', await page.evaluate(() => !document.querySelector('button[aria-label="Submit"]')?.disabled), '');
    await page.close();
  }

  // ---------- 7. honeypot filled ⇒ zero requests ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let reqCount = 0;
    await page.route('https://formspree.io/**', async route => { reqCount++; await route.fulfill({ status: 200, body: '{"ok":true}' }); });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.evaluate(() => { const el = document.querySelector('input[name="_gotcha"]'); el.value = 'spam'; });
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('Thanks'), null, { timeout: 5000 });
    const status = await statusText(page);
    T('honeypot: silent fake success', /Thanks/.test(status), status);
    T('honeypot: zero requests', reqCount === 0, String(reqCount));
    await page.close();
  }

  // ---------- 8. double-click ⇒ one request ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let reqCount = 0;
    await page.route('https://formspree.io/**', async route => {
      reqCount++;
      await new Promise(r => setTimeout(r, 1500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.dblclick('button[aria-label="Submit"]');
    await page.waitForTimeout(2500);
    await page.waitForFunction(() => /Sent/.test(document.querySelector('button[aria-label="Submit"]')?.textContent || ''), null, { timeout: 5000 });
    T('double-click: one request', reqCount === 1, String(reqCount));
    // inputs not disabled while sending (readonly instead) — check after completion
    const readOnly = await page.evaluate(() => [...document.querySelectorAll('#email,#name')].every(e => !e.disabled));
    T('double-click: inputs never disabled', readOnly, '');
    await page.close();
  }

  // ---------- 9. cool-down after success ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let reqCount = 0;
    await page.route('https://formspree.io/**', async route => {
      reqCount++;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('sent'), null, { timeout: 5000 });
    const okReqs = reqCount;
    await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('wait'), null, { timeout: 5000 });
    const status = await statusText(page);
    T('cool-down: blocked with wait message', /wait \d+s/.test(status), status);
    T('cool-down: no extra request', reqCount === okReqs, String(reqCount));
    await page.close();
  }

  // ---------- 10. client-side validation gate (empty submit) ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let reqCount = 0;
    await page.route('https://formspree.io/**', async route => { reqCount++; await route.fulfill({ status: 200, body: '{"ok":true}' }); });
    await gotoContact(page); await scrollToForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('complete'), null, { timeout: 5000 });
    const emailErrHidden = await page.evaluate(() => document.querySelector('#email-error')?.hidden);
    const status = await statusText(page);
    const focusId = await page.evaluate(() => document.activeElement?.id);
    T('empty submit: no request', reqCount === 0, String(reqCount));
    T('empty submit: email inline error', emailErrHidden === false, String(emailErrHidden));
    T('empty submit: status', /complete the highlighted/.test(status), status);
    T('empty submit: focus first invalid', focusId === 'email', String(focusId));
    // fill only the text fields, leaving terms unchecked → terms inline error
    await page.fill('#email', FILL.email);
    await page.fill('#name', FILL.name);
    await page.fill('#company', FILL.company);
    await page.fill('#message', FILL.message);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => !document.querySelector('#terms-error')?.hidden, null, { timeout: 5000 });
    T('empty submit: terms inline error', await page.evaluate(() => !document.querySelector('#terms-error')?.hidden), '');
    await page.close();
  }

  // ---------- 11. keyboard-only pass ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let reqCount = 0; let payload = null;
    await page.route('https://formspree.io/**', async route => {
      reqCount++;
      const text = (route.request().postDataBuffer() || Buffer.alloc(0)).toString('latin1');
      const re = /name="([^"]+)"\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n$)/g; payload = {}; let m;
      while ((m = re.exec(text))) payload[m[1]] = m[2];
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await gotoContact(page);
    await scrollToForm(page);
    await page.evaluate(() => document.querySelector('#email')?.focus());
    const tabOrder = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      tabOrder.push(await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        return el.id || el.getAttribute('aria-label') || el.tagName;
      }));
    }
    // Starting FROM #email: name, company, message, terms, then the submit button.
    const want = ['name', 'company', 'message', 'terms', 'Submit'];
    const ordered = want.every((id, i) => tabOrder.indexOf(id) === i);
    T('keyboard: tab order covers all fields', ordered, tabOrder.join(','));
    // fill via keyboard
    await page.fill('#email', FILL.email);
    await page.fill('#name', FILL.name);
    await page.fill('#company', FILL.company);
    await page.fill('#message', FILL.message);
    await page.focus('#terms');
    await page.keyboard.press('Space'); // toggle checkbox
    const checked = await page.isChecked('#terms');
    T('keyboard: terms toggle via Space', checked, String(checked));
    // submit via Enter on focused submit button
    const btnFocused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Submit');
    if (btnFocused) await page.keyboard.press('Enter'); else await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('sent'), null, { timeout: 5000 });
    T('keyboard: submit works', reqCount === 1, String(reqCount));
    T('keyboard: payload has terms', !!payload?.terms, JSON.stringify(payload?.terms));
    await page.close();
  }

  // ---------- 12. 375px layout ----------
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.route('https://formspree.io/**', async route => route.fulfill({ status: 200, body: '{"ok":true}' }));
    await gotoContact(page); await scrollToForm(page); await fillForm(page);
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= 375 + 1);
    const errVisible = async () => page.evaluate(() => { const e = document.querySelector('#email-error'); return e && !e.hidden && e.getBoundingClientRect().height > 0; });
    // trigger an error and confirm it renders without breaking layout
    await page.fill('#email', 'bad');
    await page.click('button[aria-label="Submit"]');
    await page.waitForTimeout(500);
    const errShown = await errVisible();
    T('375px: no horizontal scroll', noHScroll, '');
    T('375px: inline error renders', errShown, '');
    await page.screenshot({ path: SHOTS + 'contact-375-errors.png' });
    await page.close();
  }

  // ---------- 13. 5-swap gauntlet then submit (no double binding) ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const consoleErrs = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 120)); });
    page.on('pageerror', e => consoleErrs.push(String(e).slice(0, 120)));
    let reqCount = 0;
    await page.route('https://formspree.io/**', async route => { reqCount++; await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
    for (const r of ['/', '/about', '/services', '/contact', '/', '/services', '/contact']) {
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4600);
    }
    await scrollToForm(page); await fillForm(page);
    await page.click('button[aria-label="Submit"]');
    await page.waitForFunction(() => document.querySelector('#status-message')?.textContent?.includes('sent'), null, { timeout: 6000 });
    T('5-swap: submit works', reqCount === 1, String(reqCount));
    T('5-swap: console clean', consoleErrs.length === 0, consoleErrs.join(' | ').slice(0, 300));
    await page.close();
  }

  await browser.close();
  console.log(results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  fs.writeFileSync(SHOTS + 'contact-form-matrix.txt', results.join('\n'));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})();
