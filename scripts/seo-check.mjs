#!/usr/bin/env node
/**
 * seo-check.mjs — post-build SEO gate for the Decbricks dist/ output.
 *
 * Run after `npm run build` (add `npm run seo:check`). Uses parse5, which is
 * already in node_modules as a transitive dependency of Astro — no new install.
 *
 * Fails (exit 1) with a named message when any built page has:
 *   - a missing or duplicated <title> or meta description (across the
 *     intended-indexable set, i.e. the URLs in dist/sitemap.xml)
 *   - a missing, non-absolute, or non-self canonical
 *   - an unintended noindex (sitemap page with robots noindex — in a
 *     non-production build, detected via `Disallow: /` in dist/robots.txt,
 *     this is the expected launch gate and only warns)
 *   - JSON-LD that does not parse
 *   - an internal link to a page that does not exist in dist/
 *   - an <img> without an alt attribute
 *   - an HTML file over 1.5 MB (Googlebot reads ~2 MB; headroom)
 *   - the strings `1minus1`, `lorem ipsum`, `TODO` or `[VERIFY`
 *   - an indexable page (no noindex) missing from the sitemap
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const DIST = path.resolve(process.cwd(), 'dist');
const MAX_HTML_BYTES = 1.5 * 1024 * 1024;
const SKIP_BANNED_IN = /<(script|style|template)\b/i;

const failures = [];
const warnings = [];
const fail = (msg) => failures.push(msg);
const warn = (msg) => warnings.push(msg);

/* ---------- collect html files ---------- */
const htmlFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

if (!htmlFiles.length) {
  console.error('seo-check: no HTML files found in dist/ — run `npm run build` first.');
  process.exit(1);
}

/* ---------- parse5 helpers ---------- */
const attrValue = (node, name) => {
  const a = (node.attrs || []).find((x) => x.name === name);
  return a ? a.value : undefined;
};
const each = (node, fn) => {
  fn(node);
  for (const child of node.childNodes || []) each(child, fn);
};
const byTag = (doc, tag) => {
  const out = [];
  each(doc, (n) => {
    if (n.tagName === tag) out.push(n);
  });
  return out;
};
/** Text of an element, descending but stopping at excluded tags. */
const textOf = (node) => {
  let s = '';
  each(node, (n) => {
    if (n.nodeName === '#text' && !SKIP_BANNED_IN.test('')) s += n.value || '';
  });
  return s;
};
const collectText = (node, skipScriptStyle) => {
  let s = '';
  each(node, (n) => {
    if (n.nodeName === '#text') s += n.value || '';
    else if (skipScriptStyle && /^script$|^style$|^template$/.test(n.tagName || '')) {
      // skip entire subtree
      return;
    }
  });
  return s;
};

/** Route key for a dist html path: dist/index.html → '/', dist/about/index.html → '/about'. */
const routeOf = (absPath) => {
  const rel = path.relative(DIST, absPath).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404.html';
  return '/' + rel.replace(/\/index\.html$/, '').replace(/\.html$/, '');
};

/** Resolve an internal href to a route key, or null for external/anchors. */
const hrefToRoute = (href) => {
  if (!href) return null;
  let h = href.split('#')[0].split('?')[0];
  if (h === '') return null; // pure-anchor or empty
  if (/^(mailto:|tel:|https?:)/i.test(href)) return null;
  if (!h.startsWith('/')) h = '/' + h; // tolerate relative — flag as-is below
  h = h.replace(/\/+$/, '');
  return h === '' ? '/' : h;
};

const routeExists = (route) => {
  if (route === '/') return existsSync(path.join(DIST, 'index.html'));
  return (
    existsSync(path.join(DIST, route.replace(/^\//, ''), 'index.html')) ||
    existsSync(path.join(DIST, route.replace(/^\//, '') + '.html'))
  );
};

/* ---------- sitemap ---------- */
let sitemapRoutes = [];
const sitemapPath = path.join(DIST, 'sitemap.xml');
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const u = new URL(m[1].trim());
      sitemapRoutes.push((u.pathname.replace(/\/+$/, '') || '/'));
    } catch {
      fail(`sitemap.xml: unparseable <loc>: ${m[1]}`);
    }
  }
} else {
  fail('dist/sitemap.xml missing');
}

/* ---------- non-production detection (launch gate) ---------- */
const robotsTxtPath = path.join(DIST, 'robots.txt');
const isNonProduction =
  existsSync(robotsTxtPath) && readFileSync(robotsTxtPath, 'utf8').includes('Disallow: /');
if (isNonProduction) {
  warn('Non-production build detected (robots.txt = "Disallow: /"). Site-wide noindex is the launch gate, not a failure.');
}

/* ---------- per-page checks ---------- */
const titles = new Map(); // title -> [routes]
const descriptions = new Map();
const parsed = new Map(); // route -> { doc, canonical, robots }

for (const file of htmlFiles) {
  const route = routeOf(file);
  const raw = readFileSync(file, 'utf8');

  if (statSync(file).size > MAX_HTML_BYTES) fail(`${route}: HTML is ${(statSync(file).size / 1048576).toFixed(2)} MB (> 1.5 MB limit)`);

  // Banned strings: raw scan for template/verify residue; text-node scan for TODO.
  if (/1minus1|lorem ipsum|\[VERIFY/i.test(raw)) {
    const hit = raw.match(/1minus1|lorem ipsum|\[VERIFY/i)[0];
    fail(`${route}: banned placeholder string "${hit}"`);
  }
  const doc = parse(raw, { sourceCodeLocationInfo: false });
  const visibleText = collectText(doc, true) + ' ' +
    byTag(doc, 'img').map((i) => attrValue(i, 'alt') || '').join(' ');
  if (/\bTODO\b/.test(visibleText)) fail(`${route}: banned placeholder string "TODO"`);

  // titles/meta/canonical/robots
  const titleEls = byTag(doc, 'title');
  const title = titleEls.length ? collectText(titleEls[0], true).trim() : '';
  if (!title) fail(`${route}: missing <title>`);
  const descMeta = byTag(doc, 'meta').find((m) => attrValue(m, 'name') === 'description');
  const desc = descMeta ? attrValue(descMeta, 'content') || '' : '';
  if (!desc) fail(`${route}: missing meta description`);
  if (title) titles.set(title, [...(titles.get(title) || []), route]);
  if (desc) descriptions.set(desc, [...(descriptions.get(desc) || []), route]);

  const robotsMeta = byTag(doc, 'meta').find((m) => attrValue(m, 'name') === 'robots');
  const robots = robotsMeta ? attrValue(robotsMeta, 'content') || '' : '';
  const canonicalEl = byTag(doc, 'link').find((l) => attrValue(l, 'rel') === 'canonical');
  const canonical = canonicalEl ? attrValue(canonicalEl, 'href') || '' : '';
  parsed.set(route, { doc, title, desc, robots, canonical, route, isSitemap: sitemapRoutes.includes(route.replace(/\/$/, '')) || sitemapRoutes.includes(route) });

  // JSON-LD
  for (const s of byTag(doc, 'script')) {
    if (attrValue(s, 'type') === 'application/ld+json') {
      try {
        JSON.parse(collectText(s, false));
      } catch (e) {
        fail(`${route}: JSON-LD does not parse (${e.message})`);
      }
    }
  }

  // images need alt
  for (const img of byTag(doc, 'img')) {
    if (!img.attrs || !img.attrs.some((a) => a.name === 'alt')) {
      const src = attrValue(img, 'src') || '(no src)';
      fail(`${route}: <img src="${src}"> is missing an alt attribute`);
    }
  }

  // internal links resolve
  for (const a of byTag(doc, 'a')) {
    const href = attrValue(a, 'href');
    if (!href || href.startsWith('#')) continue;
    if (/^(mailto:|tel:|https?:)/i.test(href)) continue;
    const target = hrefToRoute(href);
    if (target === null) continue;
    if (!routeExists(target)) fail(`${route}: internal link "${href}" resolves to a page that does not exist in dist/`);
  }
}

/* ---------- indexability set checks ---------- */
for (const [route, p] of parsed) {
  const isNoindex = /noindex/i.test(p.robots);
  if (route === '/404.html' || route === '/404') continue; // system page, always noindex

  if (p.isSitemap) {
    if (isNoindex) {
      if (isNonProduction) warn(`${route}: in sitemap but noindex (expected: launch gate)`);
      else fail(`${route}: in sitemap but has a noindex robots meta`);
    }
    // title/description/canonical
    if (!p.title) fail(`${route}: missing <title> (indexable page)`);
    if (!p.desc) fail(`${route}: missing meta description (indexable page)`);
    if (!p.canonical) {
      if (isNoindex && isNonProduction) warn(`${route}: no canonical (launch-gate noindex)`);
      else fail(`${route}: missing canonical (indexable page)`);
    } else {
      let abs;
      try {
        abs = new URL(p.canonical);
      } catch {
        fail(`${route}: canonical "${p.canonical}" is not absolute`);
        abs = null;
      }
      if (abs) {
        if (abs.protocol !== 'https:') fail(`${route}: canonical is not https`);
        const self = (abs.pathname.replace(/\/+$/, '') || '/') === (route === '/404.html' ? '/404.html' : route);
        if (!self) fail(`${route}: canonical "${p.canonical}" does not point at itself`);
      }
    }
  } else if (!isNoindex) {
    if (isNonProduction) {
      // In non-prod builds everything is noindex, so this cannot fire here.
    }
    fail(`${route}: page without noindex is missing from sitemap.xml (intended indexable?)`);
  }
}

/* ---------- duplicates ---------- */
for (const [t, routes] of titles) if (routes.length > 1) fail(`duplicate <title> "${t}" on: ${routes.join(', ')}`);
for (const [d, routes] of descriptions) if (routes.length > 1) fail(`duplicate meta description "${d.slice(0, 60)}…" on: ${routes.join(', ')}`);

/* ---------- sitemap URLs that don't exist ---------- */
for (const route of sitemapRoutes) {
  if (!routeExists(route)) fail(`sitemap.xml lists "${route}" but dist/ has no such page`);
}

/* ---------- report ---------- */
console.log(`seo-check: ${htmlFiles.length} HTML files, ${sitemapRoutes.length} sitemap URLs`);
for (const w of warnings) console.log(`WARN  ${w}`);
if (failures.length) {
  console.error(`\nseo-check: ${failures.length} failure(s):`);
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('seo-check: PASS');
