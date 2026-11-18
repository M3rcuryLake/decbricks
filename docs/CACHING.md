# Client-Side HTTP Caching & Asset Policy

**Status:** Active (`2026-11-16`).

## 1. Deploy Target
No hosting configuration (`netlify.toml`, `vercel.json`, `wrangler.toml`, `Dockerfile`, `nginx.conf`, or `.github/workflows/`) existed in the repository; `astro.config.mjs` outputs static `dist/` with no server adapter. Because the live production host could not be determined from the repo, caching rules were written for the three common static targets:
1. **Cloudflare Pages / Netlify:** [public/_headers](file:///home/ankit/GitHub/decbricks/public/_headers) (copied into `dist/_headers`).
2. **Vercel:** [vercel.json](file:///home/ankit/GitHub/decbricks/vercel.json) (repo root, `trailingSlash: false`).
3. **Nginx / self-hosted static VPS:** Copy-ready `server {}` snippet in §5 below.

*(Neither `public/_headers` nor `vercel.json` is interpreted by local `astro preview`; production headers take effect on the live host.)*

---

## 2. Asset Inventory & Cache Classification

### A. Content-Hashed Assets (`/_astro/*` -> `public, max-age=31536000, immutable`)
Every image imported from `src/assets/` is emitted under `/_astro/` with a content hash in its filename (either Astro `<Picture>`/`getImage()` AVIF/WebP derivatives or byte-identical Vite `?url` copies with `vite.build.assetsInlineLimit: 512`):

| Group | Source Directory | Files | Build Output | Code Owners |
| :--- | :--- | ---: | :--- | :--- |
| About | `src/assets/about/*.webp` | 7 | `/_astro/*.{avif,webp}` | `src/data/about.ts`, `AboutBlock.astro`, `about.astro` |
| Services | `src/assets/service/*.png` | 7 | `/_astro/*.{avif,webp,png}` | `src/data/services.ts`, `ServiceBlock.astro`, `services.astro` |
| Projects | `src/assets/projects/*.png` | 4 | `/_astro/*.{avif,webp}` | `src/data/projects.ts`, `CaseStudies.astro` |
| Company logos | `src/assets/companyLogos/*.webp` | 12 | `/_astro/*.webp` | `src/data/company-logos.ts`, `ServicesClients.astro`, `CaseStudies.astro` |
| Shared contact art | `src/assets/shared/computer-{back,front}-*.webp` | 12 | `/_astro/computer-*.webp` (moved from `public/assets/shared/`, zero re-encoding) | `src/components/ContactForm.astro` |
| Shared WebGL sprite | `src/assets/shared/square-solid.png` | 1 | Inlined (`136 B` < `assetsInlineLimit: 512`) inside hashed `/_astro/impl.*.js` | `src/scripts/webgl/impl.ts` |

### B. Un-Hashed `public/` Assets (`max-age=86400, stale-while-revalidate=604800`, NEVER `immutable`)
Files kept in `public/` keep stable URLs (for CSS `url()`, favicons, JSON-LD `Organization.logo`, OG crawlers, preloaded fonts, or large standalone MP4 playback):

| Path | Size | Format | Reason Kept in `public/` |
| :--- | ---: | :--- | :--- |
| `public/videos/decbricks-showreel.mp4` | `14,294,975 B` | H.264 + AAC MP4 (`1280×720`, `30.8s`, `+faststart`) | Plain-URL streaming MP4 in `Hero.astro` (`data-preview-mp4`) & `video-player.ts` (`SHOWREEL_MP4`); byte-range `206` required |
| `public/brand/logo*.webp` | `10–17 KB` | WebP (`278×256`) | CSS `url(/brand/logo*.webp)` in `decbricks.css`, `<link rel="preload">` in `Base.astro`, `Footer.astro`, `image-preload-runtime.ts`, and `scripts/check-brand.py` |
| `public/brand/{favicon*,apple-touch-icon,icon-*,logo.png}` | `0.8–299 KB` | ICO / PNG | Stable URLs for favicons, PWA icons, and JSON-LD `Organization.logo` (`schema.ts`) |
| `public/og-default.jpg` | `63,290 B` | JPEG (`1200×630`) | Canonical Open Graph / Twitter card; stable URL required by social scrapers and under WhatsApp's ~300 KB preview limit |
| `public/og-default.png` | `439,643 B` | PNG (`1200×630`) | Legacy card kept so previews cached against the old URL still resolve |
| `public/fonts/*.woff2` | `22–34 KB` | WOFF2 | Preloaded font URLs in `global.css` & `Base.astro` |

Non-media metadata served from the build: `robots.txt` + `sitemap.xml` (endpoints) and `public/5916762549f64c18a08b8e4218667fe9.txt` (IndexNow ownership key file, protocol Option 1 — must be a UTF-8 text file at the site root containing only the key) all revalidate at `max-age=3600, must-revalidate`.

---

## 3. Baseline Response Headers (`npm run preview` on `http://127.0.0.1:4332`)
Measured directly via Playwright `APIRequestContext` on the built `dist/`:

| Class / URL | Status | `Cache-Control` (Preview) | Target Prod `Cache-Control` | `ETag` | `Last-Modified` | `Accept-Ranges` | `Content-Type` | `Content-Length` | `Content-Encoding` |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | ---: | :--- |
| `/` (HTML) | `200` | `no-cache` | `public, max-age=0, must-revalidate` | Weak ETag | `(missing)` | `(missing)` | `text/html` | `(missing)` | `gzip` |
| `/_astro/airstrip.*.webp` | `200` | `no-cache` | `public, max-age=31536000, immutable` | Weak ETag | Present | `(missing)` | `image/webp` | `130112` | `(none)` |
| `/_astro/airstrip.*.avif` | `200` | `no-cache` | `public, max-age=31536000, immutable` | Weak ETag | Present | `(missing)` | `image/avif` | `152639` | `(none)` |
| `/_astro/computer-back-300.*.webp` | `200` | `no-cache` | `public, max-age=31536000, immutable` | Weak ETag | Present | `(missing)` | `image/webp` | `38222` | `(none)` |
| `/brand/logo-cream.webp` | `200` | `no-cache` | `public, max-age=86400, stale-while-revalidate=604800` | Weak ETag | Present | `(missing)` | `image/webp` | `10224` | `(none)` |
| `/og-default.png` | `200` | `no-cache` | `public, max-age=86400, stale-while-revalidate=604800` | Weak ETag | Present | `(missing)` | `image/png` | `439643` | `(none)` |
| `/fonts/hanken-grotesk-latin.woff2` | `200` | `no-cache` | `public, max-age=86400, stale-while-revalidate=604800` | Weak ETag | Present | `(missing)` | `font/woff2` | `34704` | `(none)` |
| `/videos/decbricks-showreel.mp4` (`200`) | `200` | `no-cache` | `public, max-age=86400, stale-while-revalidate=604800` | Weak ETag | Present | `(missing)` on 200 | `video/mp4` | `14294975` | `(none)` |
| `/videos/decbricks-showreel.mp4` (`Range: bytes=0-1023`) | `206` | `no-cache` | `public, max-age=86400, stale-while-revalidate=604800` | Weak ETag | Present | `bytes` | `video/mp4` | `1024` | `(none)` |

---

## 4. Service Worker Decision & Loading Hints
- **No Service Worker:** Both Netlify/Cloudflare Pages and Vercel/Nginx natively apply custom `Cache-Control`, `ETag`, and `Accept-Ranges: bytes`. Skipping a Service Worker avoids stale HTML/navigation issues and avoids Cache API failures on `206 Partial Content` video range responses.
- **LCP `<head>` Preload Scoping:** `src/pages/about.astro` and `src/pages/services.astro` now emit `<link rel="preload" as="image" ... fetchpriority="high">` strictly for the first (`index === 0`) block image instead of all 7 blocks, preventing offscreen AVIF preloads from competing with initial critical requests while client-side SPA prefetching (`image-preload-runtime.ts`) still warms `<picture>` targets in fetched HTML bodies.
- **Below-the-fold Images & Videos:** `Footer.astro` (`logo-cream.webp`), `ServicesClients.astro` (client grid), and `TeamSection.astro` portraits use `loading="lazy" decoding="async"`; `services-page.ts` rotated client logos include `decoding="async"`. `ServiceBlock.astro` `<video>` uses `preload="metadata"`; `Hero.astro` keeps `muted playsinline preload="metadata"` on autoplaying previews (avoiding eagerly fetching `14.3 MB` on initial load) and `preload="none"` on `#showreel`.

---

## 5. Nginx Configuration Snippet
For self-hosted Nginx deployments serving `dist/`:

```nginx
server {
    listen 443 ssl http2;
    server_name decbricks.com;
    root /var/www/decbricks/dist;

    include mime.types;
    types {
        video/mp4  mp4 m4v;
        video/webm webm;
        image/avif avif;
        image/webp webp;
    }

    etag on;

    # Compress text assets only; never re-compress .webp, .avif, .mp4, .woff2
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml application/manifest+json;

    # Hashed Vite/Astro build assets (1 year immutable)
    location ^~ /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Un-hashed static media & fonts (1 day + 7-day SWR, conditional ETag)
    location ~* ^/(brand|fonts|videos)/|^/og-default\.(png|jpg)$ {
        add_header Cache-Control "public, max-age=86400, stale-while-revalidate=604800";
    }

    # Metadata, manifests & the IndexNow ownership key file
    location ~* ^/(site\.webmanifest|robots\.txt|sitemap\.xml|5916762549f64c18a08b8e4218667fe9\.txt)$ {
        add_header Cache-Control "public, max-age=3600, must-revalidate";
    }

    # HTML pages (always revalidate on deploy)
    location / {
        try_files $uri $uri/index.html =404;
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }
}
```

---

## 6. Verification Summary (`2026-11-16`)
- **Static & Build Gates:** `npm run build` (`6` pages, `12` hashed `computer-*.webp` files in `dist/_astro/`, `dist/_headers` present), `npm run check` (`0` errors, `0` warnings), `npm run check:brand`, `npm run check:placeholders`, `npm run headings`, and `npm run links` all passed.
- **Playwright Header, Reload, SPA & Range Verification:**
  - Simulated static server implementing [public/_headers](file:///home/ankit/GitHub/decbricks/public/_headers) verified exact `Cache-Control` strings across `/`, `/services`, `/_astro/computer-back-300.D26h4VI3.webp`, `/brand/logo-cream.webp`, `/videos/decbricks-showreel.mp4`, `/og-default.png`, and `/fonts/hanken-grotesk-latin.woff2`.
  - Cold visit -> `reload()` CDP check confirmed `15` `/_astro/*` disk-cache hits (`fromDiskCache: true` without conditional revalidation), `75/75` images loaded (`brokenImgs: []`), `computer-back`/`computer-front` resolved from `/_astro/*`, `/videos/decbricks-showreel.mp4` reached `readyState: 4` (`error: null`), and SPA route transitions `/ -> /services -> /about -> /contact` ran with `errs: []`.
  - `astro preview` direct checks returned HTTP `206 Partial Content` (`Accept-Ranges: bytes`, `Content-Range: bytes 500000-501023/14294975`) for mid-file video seek, HTTP `304 Not Modified` on conditional `If-None-Match` (`ETag`), and rebuild hash busting changed `computer-back-300.D26h4VI3.webp` -> `computer-back-300.gafvDmrf.webp` cleanly on a 1-byte source test (restored afterwards).
- **Mobile Lighthouse (`13.6.0`, `--only-categories=performance` on `127.0.0.1:4332`):**
  *(Lighthouse `cache-insight` — replacement for `uses-long-cache-ttl` — reports score `1.0` / `0` items on loopback hosts in both runs.)*

| Route | Before Score | After Score | Before LCP | After LCP | `cache-insight` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/` | `99` | `87` | `1.1 s` | `1.1 s` | `1.0` (`0` items) |
| `/about` | `100` | `99` | `1.1 s` | `1.1 s` | `1.0` (`0` items) |
| `/services` | `82` | `82` | `1.1 s` | `1.1 s` | `1.0` (`0` items) |
| `/contact` | `100` | `100` | `0.9 s` | `0.9 s` | `1.0` (`0` items) |
