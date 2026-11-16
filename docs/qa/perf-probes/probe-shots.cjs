// Phase 1 probe: baseline screenshots -> docs/screenshots/perf-before (full page + top viewport)
const { chromium } = require('/home/ankit/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

const BASE = 'http://localhost:4322';
const OUT = '/home/ankit/GitHub/decbricks/docs/screenshots/perf-before';
fs.mkdirSync(OUT, { recursive: true });
const ROUTES = [['home', '/'], ['services', '/services'], ['about', '/about'], ['contact', '/contact'], ['terms', '/terms'], ['notfound', '/404']];
const WIDTHS = [[390, 844], [768, 1024], [1024, 800], [1440, 900], [1920, 1080]];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  for (const [name, route] of ROUTES) {
    for (const [w, h] of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 768, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(5600); // loader (~3.0-3.8s) + entrance settle
        await page.screenshot({ path: `${OUT}/${name}-${w}-top.png` });
        await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: true });
        console.log(`shot ${name}-${w}`);
      } catch (e) {
        console.log(`FAIL ${name}-${w}: ` + String(e).slice(0, 100));
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log('SHOTS_DONE ' + fs.readdirSync(OUT).length + ' files');
})();
