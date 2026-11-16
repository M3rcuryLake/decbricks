// Phase-2 probe: focused axe checks for the PERF_BUG_REPORT a11y fixes.
// Usage: node probe-a11y.cjs [route ...]   (defaults: all 6 routes)
// Routes: home / services / about / contact / terms / notfound
// Viewports per route: mobile 412x823 (hasTouch) + desktop 1440x900.
// Rules: aria-allowed-role, label-content-name-mismatch, color-contrast.
// With A11Y_CONTRAST_SEL set, color-contrast is scoped to that CSS selector
// (used to assert the B2 owner-approved colour fixes without the known
// decorative coral flags); the other rules always run page-wide.
// Exit code 1 if any violation found. Writes JSON to ${A11Y_OUT:-/tmp/opencode/a11y.json}
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE = 'http://localhost:4322';
const ROUTES = {
  home: '/', services: '/services', about: '/about',
  contact: '/contact', terms: '/terms', notfound: '/404',
};
const OUT = process.env.A11Y_OUT || '/tmp/opencode/a11y.json';
const CONTRAST_SEL = process.env.A11Y_CONTRAST_SEL || '';
// Comma-separated selector fragments whose violations are reported but do not
// fail the run (e.g. A11Y_ALLOW='parts-scrollButton' — deferred in the ledger).
const ALLOW = (process.env.A11Y_ALLOW || '').split(',').filter(Boolean);

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ROUTES);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const out = [];
  let fail = false;
  for (const name of wanted) {
    const route = ROUTES[name];
    if (route === undefined) throw new Error('unknown route ' + name);
    for (const [label, vp] of [['mobile', { width: 412, height: 823, hasTouch: true }], ['desktop', { width: 1440, height: 900, hasTouch: false }]]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(4500); // loader + entrance settle, fonts in
        await page.addScriptTag({ path: '/home/ankit/.npm/_npx/8003d8991b0d346b/node_modules/axe-core/axe.min.js' });
        const res = await page.evaluate(async ({ contrastSel, allowFragments }) => {
          const ids = ['aria-allowed-role', 'label-content-name-mismatch'];
          const base = await window.axe.run(document, {
            runOnly: { type: 'rule', values: ids },
            resultTypes: ['violations'],
          });
          const violations = base.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              selector: Array.isArray(n.target) ? n.target.join(' > ') : String(n.target),
              summary: (n.failureSummary || '').split('\n').slice(0, 3).join(' | '),
            })),
          }));
          if (contrastSel) {
            const el = document.querySelector(contrastSel);
            if (!el) {
              violations.push({ id: 'color-contrast(scope)', impact: null, nodes: [{ selector: contrastSel, summary: 'selector not found in document' }] });
            } else {
              const cc = await window.axe.run(el, {
                runOnly: { type: 'rule', values: ['color-contrast'] },
                resultTypes: ['violations'],
              });
              for (const v of cc.violations) {
                violations.push({
                  id: 'color-contrast',
                  impact: v.impact,
                  nodes: v.nodes.map((n) => ({
                    selector: contrastSel + (Array.isArray(n.target) ? ' > ' + n.target.join(' > ') : ''),
                    summary: (n.failureSummary || '').split('\n').slice(0, 3).join(' | '),
                  })),
                });
              }
            }
          }
          return violations.filter((v) => v.nodes.length).map((v) => ({
            ...v,
            allowed: v.nodes.every((n) => allowFragments.some((f) => n.selector.includes(f))),
          }));
        }, { contrastSel: CONTRAST_SEL, allowFragments: ALLOW });
        const blocking = res.filter((v) => !v.allowed);
        if (blocking.length) fail = true;
        out.push({ route: name, vp: label, violations: res });
        console.log(name + '/' + label + ': ' + (blocking.length ? 'FAIL' : 'pass') +
          (blocking.length ? ' -> ' + blocking.map((v) => v.id + 'x' + v.nodes.length).join(', ') : '') +
          (res.some((v) => v.allowed) ? '  (allowed: ' + res.filter((v) => v.allowed).map((v) => v.id + 'x' + v.nodes.length).join(', ') + ')' : ''));
        for (const v of res) for (const n of v.nodes.slice(0, 8)) {
          console.log('    [' + v.id + (v.allowed ? ' allowed' : '') + '] ' + n.selector.slice(0, 130) + ' :: ' + n.summary.slice(0, 110));
        }
      } catch (e) {
        fail = true;
        out.push({ route: name, vp: label, error: String(e).slice(0, 300) });
        console.log(name + '/' + label + ': ERROR ' + String(e).slice(0, 200));
      }
      await ctx.close();
    }
  }
  await browser.close();
  require('fs').writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('wrote ' + OUT + ' — ' + (fail ? 'VIOLATIONS PRESENT (exit 1)' : 'all clean'));
  process.exit(fail ? 1 : 0);
})();
