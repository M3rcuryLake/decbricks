#!/usr/bin/env node
/**
 * IndexNow URL submission (zero-dep, per Implementation-plan §6 pattern).
 *
 * Protocol — https://www.indexnow.org/documentation and
 * https://www.bing.com/indexnow/getstarted:
 *
 * - Ownership is proven by hosting the UTF-8 key file at the ROOT of the
 *   submitted host (protocol Option 1): `public/5916762549f64c18a08b8e4218667fe9.txt`
 *   must be live at `https://decbricks.com/5916762549f64c18a08b8e4218667fe9.txt`
 *   and contain only the key. The key is read from that file — the single
 *   source of truth (never duplicated here).
 * - URLs always come from `dist/sitemap.xml` `<loc>` entries (run
 *   `npm run build` first), so submissions match the canonical URL list
 *   byte-for-byte — IndexNow returns 422 for URLs that don't belong to the
 *   host, and the sitemap locs are exactly the canonicals Base.astro emits.
 * - Submission goes to the shared endpoint `https://api.indexnow.org/indexnow`,
 *   which fans out to every participating search engine (Bing, Yandex, …);
 *   `keyLocation` is included per the Bing getstarted example (harmless when
 *   the key file is already at the root, explicit where it is).
 * - Single-URL mode uses the documented GET form (`url` + `key` + `keyLocation`).
 *
 * Usage:
 *   npm run indexnow                                   # submit every sitemap URL
 *   npm run indexnow -- --url=https://decbricks.com/about  # submit one URL
 *   npm run indexnow -- --force                        # allow a noindexed build
 *
 * Exits 0 on HTTP 200/202, 1 on anything else.
 * Response codes (protocol): 200 OK · 202 accepted, key validation pending ·
 * 400 invalid format · 403 key not valid · 422 URL doesn't belong to the host ·
 * 429 too many requests (spam guard).
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KEY_FILE = '5916762549f64c18a08b8e4218667fe9.txt';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Status explanations straight from the protocol's response table. */
const STATUS_MEANING = {
  200: 'OK — URLs submitted successfully',
  202: 'Accepted — URLs received, IndexNow key validation pending',
  400: 'Bad request — invalid format',
  403: 'Forbidden — key not valid (key file not found, or key not in the file)',
  422: 'Unprocessable Entity — URLs do not belong to the host, or key schema mismatch',
  429: 'Too Many Requests — potential spam; slow down and resubmit later',
};

const args = process.argv.slice(2);
const force = args.includes('--force');
const urlArg = args.find((a) => a.startsWith('--url='));
const singleUrl = urlArg ? urlArg.slice('--url='.length).trim() : undefined;

const fail = (msg) => {
  console.error(`[indexnow] ${msg}`);
  process.exit(1);
};

/** Key file → key string; validates the protocol's character set. */
const readKey = async () => {
  let raw;
  try {
    raw = await readFile(path.join(ROOT, 'public', KEY_FILE), 'utf8');
  } catch {
    fail(`key file public/${KEY_FILE} is missing — IndexNow requires it hosted at the site root.`);
  }
  const key = raw.trim();
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    fail(`public/${KEY_FILE} does not contain a valid key (8–128 chars of a-z A-Z 0-9 dash).`);
  }
  return key;
};

/** URLs: single-URL arg, or every canonical <loc> in the built sitemap. */
const readUrls = async () => {
  if (singleUrl) {
    try {
      const u = new URL(singleUrl);
      if (u.protocol !== 'https:' || u.pathname === '') throw new Error('not an https page URL');
      // No trailing slash — matches `trailingSlash: false` and the sitemap locs.
      return [u.href.replace(/\/$/, '')];
    } catch {
      fail(`--url expects an absolute https page URL, got "${singleUrl}".`);
    }
  }
  let sitemap;
  try {
    sitemap = await readFile(path.join(ROOT, 'dist', 'sitemap.xml'), 'utf8');
  } catch {
    fail('dist/sitemap.xml not found — run `npm run build` first (URLs come from the built sitemap).');
  }
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) fail('dist/sitemap.xml has no <loc> entries.');
  return urls;
};

/** Launch gate: a non-production build is noindexed — submitting it is noise. */
const guardNoindex = async () => {
  try {
    const robots = await readFile(path.join(ROOT, 'dist', 'robots.txt'), 'utf8');
    if (robots.includes('Disallow: /') && !force) {
      fail(
        'dist/robots.txt disallows crawling (non-production build, PUBLIC_ENV gate) — ' +
          'search engines cannot index these URLs. Deploy the production build first, ' +
          'or pass --force to submit anyway.'
      );
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e; // missing robots.txt in dist is not fatal (endpoint site)
  }
};

const key = await readKey();
const urls = await readUrls();
await guardNoindex();

const origin = new URL(urls[0]).origin;
const keyLocation = `${origin}/${KEY_FILE}`;

let res;
if (singleUrl) {
  // Protocol "Submitting One URL": GET with url + key (+ keyLocation).
  const get = new URL(ENDPOINT);
  get.searchParams.set('url', singleUrl);
  get.searchParams.set('key', key);
  get.searchParams.set('keyLocation', keyLocation);
  console.log(`[indexnow] GET ${get.host}${get.pathname} url=${singleUrl}`);
  res = await fetch(get, { headers: { 'User-Agent': 'decbricks-indexnow/1.0' } });
} else {
  // Protocol "Submitting set of URLs": POST JSON to the shared endpoint.
  const body = { host: new URL(origin).host, key, keyLocation, urlList: urls };
  console.log(`[indexnow] POST ${new URL(ENDPOINT).host} — ${urls.length} URL(s) for host ${body.host}`);
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
}

const meaning = STATUS_MEANING[res.status] ?? `unexpected HTTP ${res.status}`;
const list = singleUrl ? `  - ${singleUrl}` : urls.map((u) => `  - ${u}`).join('\n');
console.log(`[indexnow] HTTP ${res.status} — ${meaning}\n[indexnow] keyLocation: ${keyLocation}\n[indexnow] submitted:\n${list}`);

// 200/202 both mean the engine accepted the notification (202 = key check pending).
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
