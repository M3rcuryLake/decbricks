import type { APIRoute } from 'astro';
import { execFileSync } from 'node:child_process';
import { SITE_URL } from '../data/site';

/**
 * Hand-written sitemap (zero-dep, per Implementation-plan §6).
 * Lists indexable pages only:
 * - `/`, `/about`, `/services` (7 Decbricks services landed 2026-11-14), `/contact`.
 * - `/404` is a system error page (`noindex`).
 * Add a route here when a page becomes indexable.
 */

/** Route URL → source file whose last git commit dates the page. */
const ROUTES: Array<[url: string, file: string]> = [
  ['/', 'src/pages/index.astro'],
  ['/about', 'src/pages/about.astro'],
  ['/services', 'src/pages/services.astro'],
  ['/contact', 'src/pages/contact.astro'],
];

/**
 * Lastmod from the route file's last git commit (T-3), not the build date —
 * rebuilding must not claim every page changed. Falls back to today when git
 * is unavailable (e.g. a shallow CI clone).
 */
const lastCommitDate = (file: string): string => {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  ([p, file]) => `  <url>
    <loc>${new URL(p, SITE_URL + '/').href.replace(/\/$/, '') || SITE_URL}</loc>
    <lastmod>${lastCommitDate(file)}</lastmod>
  </url>`
).join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
