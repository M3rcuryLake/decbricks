/**
 * Legal page (/terms unified Terms of Service + Privacy Policy) & wiring matrix.
 * Usage: node docs/qa/legal-pages.cjs [base_url]  (default http://localhost:4321)
 */
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const SHOTS = '/home/ankit/GitHub/decbricks/docs/qa/shots/';
const BASE = process.argv[2] || 'http://localhost:4321';
const results = [];
const T = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

async function load(page, path, wait = 2000) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
}

(async () => {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    executablePath: '/usr/bin/google-chrome',
  });

  // --- 1. /terms structure, box, typography hierarchy, responsive, print ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errs.push(m.text().slice(0, 140));
    });
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));

    await load(page, '/terms');

    const info = await page.evaluate(() => {
      const box = document.querySelector('.legal-island article.parts-serviceBlock');
      const corners = box ? box.querySelectorAll(':scope > span.bg-purple').length : 0;
      const clauseTitle = document.querySelector('.legal-clauseTitle');
      const privacyTitle = document.querySelector('#privacy-policy-heading');
      const docBody = document.querySelector('.legal-docBody');
      const boxRect = box?.getBoundingClientRect();
      const bodyRect = docBody?.getBoundingClientRect();
      return {
        h1: document.querySelectorAll('h1').length,
        h1Text: document.querySelector('h1')?.textContent?.trim() || '',
        tosH2s: document.querySelectorAll('.legal-docBody > .legal-clause h2').length,
        privacyH2s: document.querySelectorAll('#privacy-policy > h2').length,
        privacyH3s: document.querySelectorAll('#privacy-policy .legal-clause h3').length,
        hasBox: !!box,
        corners,
        hasRail: document.querySelectorAll('.legal-rail').length > 0,
        hasNums: document.querySelectorAll('.legal-num').length > 0,
        hasProgress: document.querySelectorAll('.legal-progress').length === 1,
        hasTopBtn: document.querySelectorAll('.legal-top').length === 1,
        clauseFontPx: clauseTitle ? parseFloat(getComputedStyle(clauseTitle).fontSize) : 0,
        privacyFontPx: privacyTitle ? parseFloat(getComputedStyle(privacyTitle).fontSize) : 0,
        boxWidth: boxRect ? Math.round(boxRect.width) : 0,
        bodyWidth: bodyRect ? Math.round(bodyRect.width) : 0,
        placeholders: (document.querySelector('main')?.textContent || '').match(/\[[^\]]{3,60}\]/g)?.length || 0,
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
        formCheckboxes: document.querySelectorAll('form.sections-contactForm__form').length,
        title: document.title,
      };
    });

    T('/terms: page exists (not 404)', info.h1 === 1 && info.title.includes('Terms of Service'), info.title);
    T('/terms: H1 mentions Terms of Service', info.h1Text.includes('Terms of Service'), info.h1Text);
    T('/terms: inside article.parts-serviceBlock with 4 corners', info.hasBox && info.corners === 4, `corners=${info.corners}`);
    T('/terms: 14 ToS h2 clauses + 1 Privacy h2 + 11 Privacy h3 clauses', info.tosH2s === 14 && info.privacyH2s === 1 && info.privacyH3s === 11, `${info.tosH2s}/${info.privacyH2s}/${info.privacyH3s}`);
    T('/terms: .legal-num and .legal-rail removed', !info.hasNums && !info.hasRail, `nums=${info.hasNums}, rail=${info.hasRail}`);
    T('/terms: .legal-progress and .legal-top present', info.hasProgress && info.hasTopBtn, '');
    T('/terms: Privacy Policy heading larger than clause titles', info.privacyFontPx > info.clauseFontPx + 4, `privacy=${info.privacyFontPx}px vs clause=${info.clauseFontPx}px`);
    T('/terms: prose column constrained inside wider box', info.bodyWidth > 0 && info.bodyWidth < info.boxWidth, `body=${info.bodyWidth}px < box=${info.boxWidth}px`);
    T('/terms: template placeholders present', info.placeholders >= 10, String(info.placeholders));
    T('/terms: noindex while draft', /noindex/.test(info.robots), info.robots);
    T('/terms: no contact form embedded', info.formCheckboxes === 0, String(info.formCheckboxes));
    const domainSplit = await page.evaluate(() =>
      [...document.querySelectorAll('.font-brand')].some((el) => (el.nextSibling?.textContent || '').startsWith('.com'))
    );
    T('/terms: decbricks.com not split by .font-brand', !domainSplit, '');

    // Scroll to box top & capture
    await page.evaluate(() => document.querySelector('.legal-island')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(700);
    await page.screenshot({ path: SHOTS + 'legal-terms-1280.png' });

    // Scroll to #privacy-policy, verify visibility + back-to-top + progress hairline
    await page.evaluate(() => document.querySelector('#privacy-policy')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    const privacyVis = await page.evaluate(() => {
      const h = document.querySelector('#privacy-policy-heading');
      const topBtn = document.querySelector('.legal-top');
      const btnRect = topBtn?.getBoundingClientRect();
      return {
        opacity: h ? getComputedStyle(h).opacity : '0',
        topBtnVisible: topBtn ? !topBtn.hasAttribute('hidden') : false,
        btnW: btnRect ? Math.round(btnRect.width) : 0,
        btnH: btnRect ? Math.round(btnRect.height) : 0,
      };
    });
    T('/terms: #privacy-policy heading visible after scroll', privacyVis.opacity === '1', JSON.stringify(privacyVis));
    T('/terms: back-to-top visible & >=44px', privacyVis.topBtnVisible && privacyVis.btnW >= 44 && privacyVis.btnH >= 44, `${privacyVis.btnW}x${privacyVis.btnH}`);
    await page.screenshot({ path: SHOTS + 'legal-terms-privacy-1280.png' });

    // Back-to-top click returns to 0
    await page.click('.legal-top');
    await page.waitForTimeout(1300);
    const afterTop = await page.evaluate(() => window.scrollY);
    T('/terms: back-to-top scrolls to top', afterTop < 50, `scrollY=${afterTop}`);

    // Print media hides progress & back-to-top
    await page.emulateMedia({ media: 'print' });
    const printHidden = await page.evaluate(() => {
      const p = document.querySelector('.legal-progress');
      const t = document.querySelector('.legal-top');
      return getComputedStyle(p).display === 'none' && getComputedStyle(t).display === 'none';
    });
    T('/terms: print media hides progress & back-to-top', printHidden, '');
    await page.emulateMedia({ media: 'screen' });

    // Responsive overflow sweep across 320, 375, 768, 1024, 1440
    for (const w of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width: w, height: 812 });
      await page.waitForTimeout(300);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      T(`/terms: ${w}px no horizontal scroll`, !ov, '');
      if (w === 375) {
        await page.evaluate(() => document.querySelector('#privacy-policy')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(600);
        await page.screenshot({ path: SHOTS + 'legal-terms-375.png' });
      }
    }

    T('/terms: console clean', errs.length === 0, errs.join(' | ').slice(0, 200));
    await page.close();
  }

  // --- 2. /privacy-policy route completely removed (404) ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const res = await page.goto(BASE + '/privacy-policy', { waitUntil: 'domcontentloaded' });
    const status = res?.status() ?? 0;
    T('/privacy-policy: removed (HTTP 404)', status === 404, `status=${status}`);
    await page.close();
  }

  // --- 3. Reduced motion pass ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await load(page, '/terms');
    const rm = await page.evaluate(() => {
      const h = document.querySelector('#privacy-policy-heading');
      const clauses = [...document.querySelectorAll('.legal-clause')];
      return {
        privacyOpacity: h ? getComputedStyle(h).opacity : '0',
        allVisible: clauses.length === 25 && clauses.every((c) => getComputedStyle(c).opacity === '1'),
      };
    });
    T('/terms: reduced-motion all 25 clauses + privacy heading visible', rm.privacyOpacity === '1' && rm.allVisible, JSON.stringify(rm));
    await ctx.close();
  }

  // --- 4. Contact form label links + footer links ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await load(page, '/contact');
    const labelLinks = await page.evaluate(() =>
      [...document.querySelectorAll('.parts-formCheckbox__label a')].map((a) => ({
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        text: a.textContent?.trim(),
      }))
    );
    T('contact label: two legal links', labelLinks.length === 2, JSON.stringify(labelLinks));
    T('contact label: /terms link', labelLinks.some((l) => l.href === '/terms'), '');
    T('contact label: /terms#privacy-policy link', labelLinks.some((l) => l.href === '/terms#privacy-policy'), '');
    T('contact label: target=_blank', labelLinks.every((l) => l.target === '_blank'), '');
    await page.evaluate(() => document.querySelector('.parts-formCheckbox__label a')?.click());
    await page.waitForTimeout(300);
    const onNewPage = await page.evaluate(() => ({ checked: document.querySelector('#terms')?.checked ?? null }));
    T('contact label: link click does not toggle checkbox', onNewPage.checked !== true, JSON.stringify(onNewPage));
    await page.close();
  }

  // --- 5. Footer legal links + SPA swap to /terms#privacy-policy + gauntlet ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errs.push(m.text().slice(0, 120));
    });
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));

    await load(page, '/');
    const footer = await page.evaluate(() => ({
      privacy: !!document.querySelector('.structure-footer a[href="/terms#privacy-policy"]'),
      terms: !!document.querySelector('.structure-footer a[href="/terms"]'),
    }));
    T('footer: Privacy points to /terms#privacy-policy', footer.privacy, '');
    T('footer: Terms points to /terms', footer.terms, '');

    // Click footer Privacy link to trigger client-side swap + hash scroll
    await page.click('.structure-footer a[href="/terms#privacy-policy"]');
    await page.waitForFunction(() => location.pathname === '/terms' && !window.pageSettled, null, { timeout: 6000 });
    await page.waitForTimeout(1200);
    const swap = await page.evaluate(() => {
      const h = document.querySelector('#privacy-policy-heading');
      const header = document.querySelector('.structure-menu');
      const hRect = h?.getBoundingClientRect();
      const headRect = header?.getBoundingClientRect();
      return {
        path: location.pathname + location.hash,
        opacity: h ? getComputedStyle(h).opacity : '0',
        headingTop: hRect ? Math.round(hRect.top) : -999,
        headerBottom: headRect ? Math.round(headRect.bottom) : 0,
        progressCount: document.querySelectorAll('.legal-progress').length,
      };
    });
    T(
      'SPA swap: footer Privacy navigates to /terms#privacy-policy below header',
      swap.path === '/terms#privacy-policy' &&
        swap.opacity === '1' &&
        swap.headingTop >= swap.headerBottom - 12 &&
        swap.headingTop < 500 &&
        swap.progressCount === 1,
      JSON.stringify(swap)
    );

    // Gauntlet to /contact & form submit
    let reqCount = 0;
    await page.route('https://formspree.io/**', async (r) => {
      reqCount++;
      await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    for (const r of ['/about', '/services', '/terms', '/contact']) {
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1600);
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
  const fails = results.filter((r) => r.startsWith('FAIL'));
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})();
