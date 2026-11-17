import type { APIRoute } from 'astro';
import { execFileSync } from 'node:child_process';
import { SITE_URL } from '../data/site';
import { PROJECTS } from '../data/projects';
import { ABOUT } from '../data/about';
import { SERVICES } from '../data/services';

/**
 * Hand-written sitemap (zero-dep, per Implementation-plan §6) — "all-in" spec:
 *
 * - Lists indexable pages only: `/`, `/about`, `/services`, `/contact`.
 *   `/404` (system error page) and `/terms` (`noindex` by owner default,
 *   open-items A11) are excluded. Add a route here when a page becomes indexable.
 * - `lastmod` is derived from git, never the build date (T-3): rebuilding an
 *   unchanged site must not claim every page changed. A page's date is the
 *   newest commit touching its route file, its page-owned data AND component
 *   files, or the shared chrome that renders on every page — content lives in
 *   `src/data/*` and `src/components/*`, so edits there must still move
 *   `lastmod`. `git log -1` with multiple pathspecs returns the newest touch.
 * - `<image:image>` entries list the real images each page renders, taken from
 *   the same data arrays the pages render (`PROJECTS`, `ABOUT`, `SERVICES`) —
 *   no invented URLs. `/contact`'s only images are decorative (`alt=""`), so it
 *   carries no image entries. Images help Google Images discovery, not rankings.
 * - No `priority`/`changefreq`: Google ignores them and they add noise.
 * - No hreflang: single-language site (programme constraint).
 * - Origin resolves exactly like `robots.txt.ts` (`site?.origin || SITE_URL`),
 *   so both files can never disagree.
 * - Enforced by `scripts/seo-check.mjs`: every `<loc>` must equal the page's
 *   canonical, `lastmod` must be a valid present-day `YYYY-MM-DD`, and every
 *   `<image:loc>` must exist in `dist/`.
 */

/** Shared chrome that renders on every page (layout, nav, footer, head/meta). */
const SHARED_SOURCES = [
  'src/layouts/Base.astro',
  'src/components/Header.astro',
  'src/components/Footer.astro',
  'src/components/footer/FooterContact.astro',
  'src/components/footer/FooterCta.astro',
  'src/components/footer/FooterLegal.astro',
  'src/components/footer/FooterNav.astro',
  'src/components/footer/FooterWebgl.astro',
  'src/components/footer/FooterWordmark.astro',
  'src/components/CookieBanner.astro',
  'src/data/footer.ts',
  'src/data/site.ts',
  'src/lib/schema.ts',
  'src/lib/brand.ts',
];

const imageUrls = (images: Array<{ src: { src: string } } | undefined>): string[] =>
  images.filter((i): i is { src: { src: string } } => Boolean(i)).map((i) => i.src.src);

/** Route URL → route file, page-owned sources, and images the page renders. */
const ROUTES: Array<{ url: string; sources: string[]; images: string[] }> = [
  {
    url: '/',
    sources: [
      'src/pages/index.astro',
      'src/components/Hero.astro',
      'src/components/CaseStudies.astro',
      'src/components/Testimonials.astro',
      'src/components/ContactForm.astro',
      'src/data/projects.ts',
      'src/data/testimonials.ts',
      'src/data/company-logos.ts',
    ],
    images: imageUrls(PROJECTS.map((p) => ({ src: p.src }))),
  },
  {
    url: '/about',
    sources: [
      'src/pages/about.astro',
      'src/components/ServicesHero.astro',
      'src/components/AboutBlock.astro',
      'src/components/ServicesSidebarNav.astro',
      'src/components/ContactForm.astro',
      'src/data/about.ts',
    ],
    images: imageUrls(ABOUT.map((s) => s.image)),
  },
  {
    url: '/services',
    sources: [
      'src/pages/services.astro',
      'src/components/ServicesHero.astro',
      'src/components/ServiceBlock.astro',
      'src/components/AboutBlock.astro',
      'src/components/ServicesSidebarNav.astro',
      'src/components/ContactForm.astro',
      'src/data/services.ts',
    ],
    images: imageUrls(SERVICES.map((s) => (s.media.kind === 'image' ? s.media : undefined))),
  },
  {
    url: '/contact',
    sources: [
      'src/pages/contact.astro',
      'src/components/ContactBlock.astro',
      'src/components/CalEmbed.astro',
      'src/components/ServicesSidebarNav.astro',
      'src/components/ContactForm.astro',
      'src/data/contact.ts',
    ],
    // The contact page's only images are decorative (alt="") — no image entries.
    images: [],
  },
];

let warnedGitFallback = false;
const warnGitFallbackOnce = (reason: string) => {
  if (warnedGitFallback) return;
  warnedGitFallback = true;
  // Surfaced in build logs (endpoints are evaluated at build time): a shallow
  // CI clone silently degrades every lastmod to the build date otherwise.
  console.warn(`[decbricks] sitemap: ${reason} — lastmod falling back to the build date.`);
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Lastmod = newest commit date across the page's sources; falls back to the
 * build date when git is unavailable (no checkout / shallow clone).
 */
const lastmodFor = (sources: string[]): string => {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...SHARED_SOURCES, ...sources], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
    warnGitFallbackOnce('git returned no usable commit date');
    return today();
  } catch {
    warnGitFallbackOnce('git is unavailable');
    return today();
  }
};

/** Same origin resolution as robots.txt.ts — the two files cannot disagree. */
export const originFor = (site?: URL | undefined): string => (site?.origin || SITE_URL).replace(/\/+$/, '');

/** Canonical page URL: the bare origin for `/`, no trailing slash elsewhere. */
const locFor = (origin: string, url: string): string =>
  url === '/' ? origin : new URL(url, origin + '/').href;

/** Bundled asset path (e.g. `/_astro/x.hash.webp`) → absolute image URL. */
const imageUrl = (origin: string, src: string): string => new URL(src, origin + '/').href;

export const GET: APIRoute = ({ site }) => {
  const origin = originFor(site);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${ROUTES.map(({ url, sources, images }) => {
  const imageXml = images
    .map(
      (src) => `    <image:image>
      <image:loc>${imageUrl(origin, src)}</image:loc>
    </image:image>`
    )
    .join('\n');
  return `  <url>
    <loc>${locFor(origin, url)}</loc>
    <lastmod>${lastmodFor(sources)}</lastmod>${imageXml ? `\n${imageXml}` : ''}
  </url>`;
}).join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Mirrors the host-layer rule (public/_headers, vercel.json, docs/CACHING.md).
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};
