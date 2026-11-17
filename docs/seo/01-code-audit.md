# Decbricks — Phase 1: Technical Code Audit (source, read-only)

> Date: 2026-11-17. Evidence levels: **Observed** = the code clearly does it (file:line quoted);
> **Needs verification** = depends on runtime values or hosting config not visible in the repo
> (`.env*` files are deliberately not read; deploy host is not in the repo).
> Context: the site build (Phases 0–8, `docs/PROGRESS.md`) and the content/copy pass
> (`docs/content-seo/`) are complete. This audit covers what remains beyond those.

## Ordering note

The site currently ships `noindex, nofollow` **by design** (launch gate). Items F-1–F-3 are therefore
"confirm before launch" items rather than live defects; they are listed first because they can remove
every page from the index if mishandled.

---

## A. Indexability & crawler rules

### F-1 — Site-wide `noindex, nofollow` until `PUBLIC_ENV=production` (intentional gate)
- **Where:** `src/layouts/Base.astro:51-57` — `const isProduction = import.meta.env.PUBLIC_ENV === 'production'; const robots = !isProduction ? 'noindex, nofollow' : ...`; `src/pages/robots.txt.ts:10-14` — non-production builds emit `User-agent: *` / `Disallow: /`.
- **Evidence:** Observed (code path is unambiguous; the runtime value of `PUBLIC_ENV` is what varies).
- **Risk:** if production deploys without the flag, robots.txt blocks all crawlers *and* every page is `noindex` — a double lock. If it ships `Disallow: /` while externally linked, removal can take weeks to propagate.
- **Fix:** launch-day checklist item (already documented as open-items A1/§E). Add an automated guard to `scripts/seo-check.mjs`: build must either be production-flavoured or print a loud "non-production build" warning; never allow `Disallow: /` and indexable pages simultaneously. Also verify no `X-Robots-Tag` header exists in `public/_headers` — **Observed:** `_headers` sets only caching headers, no robots headers; nothing can leak staging rules via headers.

### F-2 — Build-time env values the production deploy must supply (cannot be read here)
- **Where:** `astro.config.*` — `site: process.env.PUBLIC_SITE_URL || 'https://decbricks.com'`; `src/data/site.ts:17-18` (same fallback); `src/data/contact.ts:18-27` (`PUBLIC_CAL_LINK`, `PUBLIC_CONTACT_ENDPOINT`); `Base.astro:59` (`PUBLIC_GSC_VERIFICATION`); `Base.astro:51` (`PUBLIC_ENV`).
- **Evidence:** Needs verification — defaults exist so a missing variable fails *soft* (e.g. canonicals still point at decbricks.com; the form warns in dev), but the GSC verification meta tag and the working form endpoint only exist if the prod build sets them.
- **Fix:** pre-launch checklist: `PUBLIC_ENV=production`, form endpoint live (submit one real test), Cal link set, GSC verification tag present in built HTML.

### F-3 — Host-level redirects (www↔non-www, http→https) are not defined in the repo
- **Where:** whole repo — `public/_headers` contains only caching headers; Astro config has no redirect table.
- **Evidence:** Needs verification (depends on the hosting platform). Canonicals (`Base.astro:45-48`) are consistently absolute `https://decbricks.com/...` non-www, non-trailing-slash, so canonicalisation is internally consistent.
- **Fix:** verify at the host that `http://` and `https://www.decbricks.com` 301-redirect to `https://decbricks.com`; also confirm a `decbricks.com/404.html` (or platform 404 rule) actually serves HTTP 404 — **Needs verification** once deployed (Astro statically emits `404.html` at the root, but the status code is the host's decision).

## B. `<head>` generation per route

### F-4 — Every route supplies a unique title, description and canonical — pass
- **Where:** `src/pages/index.astro:18-24`, `about.astro:35-41`, `services.astro:28-34`, `contact.astro:64-70` all pass `title` / `description` / `canonical` explicitly; `404.astro:7-12` and `LegalPage.astro:52-58` cover the noindex pages. Uniqueness of the copy itself was verified in the content pass.
- **Evidence:** Observed. Canonicals resolve to absolute https non-trailing URLs (`Base.astro:45-48`), matching `trailingSlash: 'never'` in `astro.config.*`. Canonical is suppressed on `noindex` pages (`Base.astro:95` — `{!noindex && <link rel="canonical" href={canonical} />}`), a deliberate copy-pass decision; harmless.
- **Residual risk:** `Base.astro:26` default title `Decbricks | ${SITE.tagline}` still exists for any future page that forgets to pass `title`. **Fix:** the Phase 4 checker should fail any built page that reuses the default title/description verbatim, so a future route cannot silently ship it.

### F-5 — Sitemap `lastmod` changes on every build regardless of content
- **Where:** `src/pages/sitemap.xml.ts:13` — `const lastmod = new Date().toISOString().slice(0, 10);`
- **Evidence:** Observed.
- **Impact:** low but real — a lastmod that says "changed today" every day teaches crawlers the value is meaningless.
- **Fix:** derive per-URL dates from git history at build time (file's last commit date), or drop `lastmod` entirely. Git-derived is accurate and zero-dependency (`node:child_process` at build). Phase 4 ticket.

### F-6 — robots.txt has no per-crawler rules (AI-crawler policy undecided)
- **Where:** `src/pages/robots.txt.ts:12-14` — production body is exactly `User-agent: * / Allow: /` + Sitemap line.
- **Evidence:** Observed. Nothing blocks or invites AI crawlers specifically (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot, etc. all inherit `User-agent: *`).
- **Fix:** none yet — this is a policy decision reserved for `06-ai-search.md` and the review gate. Recorded here only so the audit is complete.

## C. Content served in server HTML

### F-7 — Main text and links are server-rendered; nav/service CTAs are real `<a href>` — pass
- **Where:** header nav `src/components/Header.astro:15,33,101` (`<a`); home service-card CTAs `src/components/Hero.astro:564-565` (`<a href={`/services#${service.id}`} aria-label={`Find Out More about ${service.title}`}>`); hero showreel and service cards are server HTML. Client-side page swaps (`src/scripts/main.ts` + `page-transition.ts`) replace content but the built `dist/*.html` carries everything.
- **Evidence:** Observed.

### F-8 — The primary "Book a call" CTA is a JS-modal button with no `href` when Cal is configured
- **Where:** `src/components/Hero.astro:54,95` — `href={hasCalLink ? undefined : CAL.bookingUrl || '/contact#book-a-call'}` (the `href` is undefined when a Cal link exists; the button opens the Cal modal instead).
- **Evidence:** Observed.
- **Impact:** crawlers never see the conversion target as a link from the hero; visitors without JS (or before hydration) have no clickable path from the hero CTA. Header/footer still link `/contact`, so this is low, not critical.
- **Fix:** render the hero CTA as a real `<a href="/contact#book-a-call">` that JS *upgrades* to the modal (progressive enhancement), or keep the modal and add a visible text link to `/contact`. Decide in Phase 3/4; respects "booking behaviour unchanged" as the destination stays the same.

### F-9 — Work/project cards contain no links at all (no case-study pages exist)
- **Where:** `src/components/CaseStudies.astro` — no `<a` element anywhere in the component (verified by search); project posters are static cards with title + category pill (owner decision V-4: keep cards as title + pill).
- **Evidence:** Observed.
- **Impact:** the "work" proof is not crawlable as separate pages, and there is no URL a searcher or AI assistant can be sent to for a specific project. This is an architecture gap, not a bug — addressed in `03-architecture.md` / `04-content-plan.md` (proposal only, gated on real content existing per the no-invented-facts rule).

## D. Size, scripts and rendering performance

### F-10 — Bundle shape is already good; two stale-risk items remain
- **Where:** `astro.config.*:33-56` — three.js impl is a dynamic-import chunk; gsap/lenis split into manual chunks; `chunkSizeWarningLimit: 600`.
- **Evidence:** Observed (config) + `docs/PROGRESS.md` Phase 7 numbers (render-blocking bundle 871→315 KB; three.js 556 KB async). Current numbers **Needs verification** in the Phase 2 build.
- **Known heavies:** `src/styles/global.css` is ~157 KB compiled template CSS (documented template artefact, out of scope); terms page is ~3,500 words of legal text — HTML-size check in Phase 2 against the 2 MB crawler limit (it will be far under, but measured).

### F-11 — Departure Mono is preloaded although the recorded decision says it is not
- **Where:** `src/layouts/Base.astro:118` — `<link rel="preload" as="font" ... href="/fonts/departure-mono-regular.woff2" />`; `docs/PROGRESS.md` session log 2026-11-11: "Departure Mono no longer preloaded (fallback-only, first-paint files 3)".
- **Evidence:** Observed (contradiction between shipped head markup and the recorded decision). The `@font-face` also has `src:local("Departure Mono")` first, so most visitors never fetch it — making the preload pure waste for them.
- **Fix:** remove the preload line (or, if small mono labels genuinely first-paint with it on fresh machines, re-record the decision). One-line ticket.
- Note: the other three preloads (`power-grotesk`, `hanken-grotesk`, `fk-raster`) match the live `@font-face` sources in `global.css` — pass. Font files use `font-display: swap`; sans faces have metric-matched fallback faces.

### F-12 — Third-party scripts: only Cal.com, and only after consent — pass
- **Where:** `src/scripts/cal-embed.ts` header comment — "embed.js is only loaded after the CookieBanner has stored consent"; lazy via IntersectionObserver (400 px margin), one injection per page-load, fallback card on failure.
- **Evidence:** Observed. No analytics, ads, or tracking scripts exist anywhere in `src/` — this is also the Phase 3/08 measurement gap (nothing currently records form submissions or bookings).

## E. Images, video, fonts

### F-13 — Image handling is strong — pass, one `og:image` quality flag
- **Evidence:** Observed. About/Service blocks preload exact AVIF srcsets with `fetchpriority="high"` on the first image (`src/lib/image-preload.ts:40`, `about.astro:52`, `services.astro:46`, `ServiceBlock.astro:128`, `AboutBlock.astro:137`); below-fold images carry `loading="lazy" decoding="async"` and explicit dimensions (`CaseStudies.astro:51,125,212`, `ContactForm.astro:244,258`, `Footer.astro:46`); every `<img>` has an `alt` attribute (decorative ones `alt=""`). WebP/AVIF throughout.
- **Flag:** `ogImage` (`src/data/site.ts:28` → `/og-default.png`, 1200×630 — measured) is a documented TEMP image (open-items A6: "OG image = TEMP brand PNG"). It renders correctly but is not a designed share card. Owner item, unchanged.

### F-14 — Hero video attributes are sensible — pass
- **Where:** `src/components/Hero.astro:79,112` (`preload="metadata"`), `:363` (`preload="none"`), autoplay/muted/playsinline present (6 attribute matches).
- **Evidence:** Observed. Video is not an LCP img risk; the LCP element will be text or the video's first frame. Lab CWV numbers recorded in Phase 2 as diagnostics only.

## F. Structured data

### F-15 — JSON-LD is generated from one source of truth and matches visible content — pass, two gaps noted
- **Where:** `src/lib/schema.ts` — single helper module; `Organization` (name, url, logo `/brand/logo.png`, Chennai/Tamil Nadu address, `areaServed: ['IN','Worldwide']`, `sameAs` = three owner-resolved social profiles, email) + `WebSite` on all four indexable pages; `BreadcrumbList` on the three inner pages; `CollectionPage` with per-service `Service` items + `OfferCatalog` on `/services` (matches the seven visible blocks).
- **Evidence:** Observed. No `Review`/`AggregateRating` anywhere (correct — no verifiable review content rendered as markup-eligible content).
- **Gap 1:** `Organization` has no `contactPoint` (`PHONES` data is empty by design, graceful-hidden). When the owner supplies phone numbers, add it — open-items A3.
- **Gap 2:** no page-type schema beyond About/Contact/Collection (no `ProfessionalService`/`LocalBusiness`). Whether to change type is a Phase 3 decision (05-structured-data.md), not a defect.

## G. Leftover template content & hygiene

### F-16 — No template leftovers in shipped code — pass
- **Evidence:** Observed. `1minus1` / `lorem` / `TODO` / Webflow: zero hits in `src/` and `public/` (only historical notes inside `docs/*.md`). The Phase 4 checker will guard this continuously (`1minus1`, `lorem ipsum`, `TODO`, `[VERIFY`).

### F-17 — Hygiene pass — pass with notes
- `<html lang="en">` (`Base.astro:62`), viewport (`:65`), favicon set + `apple-touch-icon` + `site.webmanifest` (`:88-93`), `theme-color`, OG/Twitter complete with `og:url` = canonical, `og:image:width/height/alt`. No `hreflang` — correct for a single-language site (`00-context.md`). No `X-Robots-Tag`, no staging leakage path in `_headers`. Cookie-banner reservation script avoids CLS (`Base.astro:71-74`). Loader-skip on repeat visits (`:78-82`).
- `robots.txt`/`sitemap.xml` are generated endpoints (not stale static files) — pass; `public/_headers` caches both only 1 h must-revalidate. Sitemap lists exactly the four indexable pages; no error/thank-you URLs; no `priority`/`changefreq` (correct).

## Summary

Nothing in the shipped code is a live SEO defect. The load-bearing risks are environmental:
(1) the production env flag + hosting redirects + 404 status are unverifiable from the repo;
(2) the sitemap `lastmod` and the Departure Mono preload are small factual fixes;
(3) the two structural gaps are the JS-only hero CTA (F-8) and the absence of any crawlable
case-study URLs (F-9), both to be resolved as proposals in Phase 3. Measurement (no analytics
at all) is the biggest *programme* gap and is handled in Phase 3/08 as a proposal.
