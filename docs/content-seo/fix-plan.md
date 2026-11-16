# Decbricks Content & SEO Fix Plan

**Goal:** Give every Decbricks page unique, verifiable, visitor-first copy, titles, meta descriptions, internal links, and matching structured data — **Critical: 3 · Quick wins: 4 · Planned: 2 (9 tickets total)**.

---

## Audit Findings Summary (Evidence from `docs/content-seo/00-inventory.md`)

1. **Titles, Meta & Main Headings:** `/` title is 71 chars and leads with the brand; `/about` title (`Our Purpose | Digital & Technology Solutions Agency`) omits `| Decbricks`; `/services` (`36` chars) and `/contact` (`46` chars) fall under 50–60 chars. On `/`, `Hero.astro` places `<h2 class="sr-only">Build. Beyond.</h2>` before `<h1>`, and `CaseStudies.astro` emits two `<h2>`s (`Our Work` + `OurWork`).
2. **Unanswered Visitor Questions:** `/` has no plain-language summary of who Decbricks serves in the hero; `/about` lacks next-step CTAs inside its sections; `/contact` repeats its meta description verbatim as `heroBody`; `/404` lacks a link to `/contact`.
3. **Topic Overlap / Cannibalisation:** `/` (`SITE.description`, 165 chars) and `/about` (`172` chars) reuse the exact same sentence; all 7 `/` `#services` cards reuse `SERVICES[i].paragraphs[0]` verbatim from `/services`.
4. **Internal Links:** `About` prose contains zero links to `/services` or `/contact`; `Contact` body contains zero links to `/services` or `/about`; `FOOTER.columns` (`services`) is empty (`links: []`); `ServiceBlock` links to `/contact?service=<id>` but `/contact` ignores `?service=`; `SITE.nav` in `site.ts` marks `About`/`Contact` `enabled: false` (stale drift vs `Header.astro`).
5. **Alt Text, Canonical, OG, Sitemap & Robots:** `COMPANY_LOGOS` `alt`s are bare names without context; canonical/OG/sitemap/robots work via `Base.astro`, `sitemap.xml.ts`, and `robots.txt.ts` (`PUBLIC_ENV=production` launch gate); `/404` emits a self-canonical alongside `noindex, nofollow`.
6. **Structured Data:** `WebSite` JSON-LD only renders on `/` (not site-wide); `Organization` renders on `/`, `/about`, `/services`, `/contact`; `BreadcrumbList` renders on `/about`, `/services`, `/contact`; `Service` + `OfferCatalog` renders on `/services` only (matching visible services).

---

## Critical

### T-1 — [x] Unique Page Titles, Meta Descriptions & Main Heading Agreement
- **Where:** `src/data/site.ts`, `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/services.astro`, `src/pages/contact.astro`, `src/components/Hero.astro`, `src/components/CaseStudies.astro`
- **What:**
  - Set unique, topic-first `<title>`s ending in `| Decbricks` (50–60 chars) and unique 140–155 char single-sentence human meta descriptions on `/`, `/about`, `/services`, `/contact` (removing the shared `/`–`/about` boilerplate). Note `V-8`: owner sign-off needed to update `Implementation-plan.md` `/about` title format.
  - Align each page's `<h1>` with its `<title>` and audience.
  - Fix `Hero.astro` heading order (remove/demote `<h2 id="hero-heading" class="sr-only">Build. Beyond.</h2>` placed above `<h1>`, pointing `aria-labelledby` at `<h1>`) and remove the duplicate `sr-only` `<h2>Our Work</h2>` in `CaseStudies.astro` (adding proper spacing in the visible `<h2>` for screen readers).
- **Who:** Content & SEO Engineer
- **Effort:** 2h
- **Acceptance criteria:**
  - `dist/{index,about,services,contact}/index.html` each have a unique `<title>` ending `| Decbricks` (50–60 chars) and unique `<meta name="description">` (140–155 chars).
  - `npm run headings` passes with zero errors and no `<h2>` before `<h1>` on `/`.
  - `og:title` and `og:description` match each page's `<title>` and meta description.
- **Verify after release:** `npm run build && npm run headings` plus inspect `<title>`, `meta[name="description"]`, and `h1` across built HTML (`/` `/about` `/services` `/contact`).

### T-2 — [x] Site-Wide JSON-LD Consistency (`Organization`, `WebSite`, `BreadcrumbList`, `Service`)
- **Where:** `src/lib/schema.ts`, `src/layouts/Base.astro`, `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/services.astro`, `src/pages/contact.astro`, `src/pages/404.astro`
- **What:**
  - Emit `Organization` and `WebSite` consistently across all indexable pages (`/`, `/about`, `/services`, `/contact`), keep `BreadcrumbList` on `/about`, `/services`, `/contact`, and keep `Service` + `OfferCatalog` on `/services` only.
  - Sync `Organization.description` and `Service.description` directly with updated visible copy in `site.ts` and `services.ts` so JSON-LD never diverges from on-page text.
  - Suppress `<link rel="canonical">` when `noindex={true}` (or explicitly on `/404` and draft `/terms`) if desired so non-indexable pages do not advertise canonicals.
- **Who:** Frontend / SEO Engineer
- **Effort:** 1.5h
- **Acceptance criteria:**
  - Every `<script type="application/ld+json">` across `dist/` parses as valid JSON.
  - Indexable pages contain `Organization` + `WebSite`; inner indexable pages contain `BreadcrumbList`; only `/services` contains `Service` nodes matching the 7 rendered service blocks.
  - `npm run check:footer` passes (parity between footer contact/socials and `Organization` schema).
- **Verify after release:** `npm run build && npm run check:footer` and JSON-LD parse check across `dist/**/*.html`.

### T-3 — [x] Differentiate Home (`/`), About (`/about`), and Services (`/services`) Value Propositions
- **Where:** `src/components/Hero.astro`, `src/data/services.ts`, `src/pages/services.astro`
- **What:**
  - Rewrite Home `Hero.astro` `<h1>` / smiley intro (`parts-smileyText`) using `decbricks-copy` so the first 100 words state what Decbricks builds (software, web/mobile apps, AI automation, design, growth), for whom (startups, businesses, and student-led initiatives), and why to book a call. Keep `"award-winning"` omitted (`V-1`).
  - Rewrite `SERVICES[i].homeSummary` in `src/data/services.ts` so `/` service cards offer concise, distinct 1-sentence buyer-outcome previews instead of duplicating `/services` `paragraphs[0]` word-for-word.
  - Tighten `/services` block leads and descriptions (`src/data/services.ts`) into active, concrete copy aligned with `docs/services-content.md` and `decbricks-copy`, preserving all 7 service titles/IDs/capabilities and marking unverified target numbers (`V-5`) `[VERIFY]` unless confirmed by owner.
- **Who:** Content & SEO Engineer
- **Effort:** 3h
- **Acceptance criteria:**
  - Zero verbatim paragraph duplication between `/` `#services` cards and `/services` `ServiceBlock`s.
  - Home first 100 visible words answer who Decbricks helps, what it builds, and what to do next (`Book a call`).
  - All facts in `services.ts` trace to `docs/services-content.md`, `docs/about-section-data.md`, or carry `[VERIFY]`; `npm run check:brand` passes.
- **Verify after release:** `npm run build && npm run check:brand` + Playwright screenshots of `/` and `/services` at `375px` and `1440px`.

---

## Quick wins

### T-4 — [x] Descriptive Internal Linking, Footer Services Links & `?service=` Pre-fill
- **Where:** `src/data/site.ts`, `src/data/footer.ts`, `src/components/Hero.astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/scripts/contact.ts`
- **What:**
  - Update `SITE.nav` in `src/data/site.ts` so `enabled: true` reflects live routes (`/about`, `/services`, `/contact`).
  - Populate `FOOTER.columns` (`services`) in `src/data/footer.ts` with links to `/services#<id>` (or top service anchors) so the Services column renders alongside Pages and Company.
  - Make Home `#services` card CTA `aria-label` / text descriptive (`Explore {service.navLabel}` or keep `"Find Out More"` visual + specific `aria-label`, ensuring WCAG label-in-name compliance).
  - Add contextual body links between `/about` → `/services` + `/contact`, and `/contact` → `/services` + `/about`.
  - Read `?service=<id>` in `src/scripts/contact.ts` on `/contact` (when linked from `ServiceBlock`'s `"Discuss {navLabel}"`) to prefill the message starter or show a selected-service note cleanly, without altering Formspree payload structure.
- **Who:** Frontend Engineer
- **Effort:** 2h
- **Acceptance criteria:**
  - Every indexable page is reachable from header, footer, and at least one in-content contextual link.
  - Clicking `Discuss AI & Automation` on `/services` lands on `/contact?service=ai-automation` and reflects the chosen service in the contact section.
  - `npm run links` passes with zero broken internal links or anchors.
- **Verify after release:** `npm run build && npm run links` + Playwright navigation check from `/services#ai-automation` → `/contact?service=ai-automation`.

### T-5 — [x] About Page Source Completeness & Next-Step Framing
- **Where:** `src/data/about.ts`, `src/pages/about.astro`
- **What:**
  - Investigate `V-7`: restore the omitted first sentence of `docs/about-section-data.md` into `ABOUT[0]` (strictly adhering to `AGENTS.md` rule 5 verbatim source) or confirm with owner.
  - Use a clearer `ServicesHero` intro on `/about` (drawn verbatim from `ABOUT[0]`) and add an inline CTA bar / links under the `#philosophy` closing line pointing visitors to `/services` (`Explore our seven services`) and `/contact` (`Start a project`).
- **Who:** Content & SEO Engineer
- **Effort:** 1h
- **Acceptance criteria:**
  - `src/data/about.ts` matches `docs/about-section-data.md` verbatim (or documented owner override).
  - `/about` visitors have an explicit contextual link to `/services` and `/contact` above the bottom form.
- **Verify after release:** `npm run build && npm run check:brand && npm run links`.

### T-6 — [x] Contact Page Copy Clarity, Booking Chip Sync & Microcopy
- **Where:** `src/pages/contact.astro`, `src/components/ContactForm.astro`, `src/components/CalEmbed.astro`
- **What:**
  - Replace `contact.astro` `heroBody` (currently identical to meta description) with direct visitor-oriented hero prose explaining how to reach Decbricks (book a call or send a brief).
  - Investigation / Fix (`V-6`): align `bookingChips` (`"30 min or 1 hour"`) with actual Cal.com slot durations (`15m / 25m / 40m` per `open-items.md` A2) or mark `[VERIFY]` until owner confirms.
  - Break `startProjectBody` into clear scannable steps matching `legal.ts` (`5–8 days` review, `2–3 revision rounds`, `14 days` post-launch support) and add contextual links to `/services` and `/about`.
  - Refine `ContactForm.astro` default `smileyCopy` and `CalEmbed.astro` fallback microcopy in British/Indian English.
- **Who:** Content & SEO Engineer
- **Effort:** 1.5h
- **Acceptance criteria:**
  - `heroBody` on `/contact` differs from `<meta name="description">`.
  - Booking duration text matches Cal.com config or carries `[VERIFY]`.
  - Cal.com embed, Formspree submission, and `data-lenis-prevent` remain untouched functionally.
- **Verify after release:** `npm run build && npm run check` + Playwright check on `/contact` at `375px` and `1440px`.

### T-7 — [x] Legal & 404 Page Titles, Meta Descriptions & Heading Structure
- **Where:** `src/data/legal.ts`, `src/components/LegalPage.astro`, `src/pages/404.astro`
- **What:**
  - **Terms (`/terms`):** Do **not** alter legal clause wording (`TERMS`, `PRIVACY`, preambles). Update `TERMS_DOC.seoTitle` (`Terms of Service & Privacy Policy | Decbricks`, 45 chars → target 50–60 chars, e.g. `Terms of Service & Privacy Policy Guide | Decbricks` or keep `Terms of Service & Privacy Policy | Decbricks` if clearest) and `seoDescription` (140–155 chars); verify `<h1>` covers both Terms of Service and Privacy Policy (`Terms of Service & Privacy Policy`), keeping `noindex={true}` intact.
  - **404 (`/404`):** Improve `<title>` (`Page Not Found — Explore Our Work | Decbricks`), meta description (140–155 chars), helpful recovery message, and add a `"Contact Us"` recovery link alongside Home and Services.
- **Who:** Content & SEO Engineer
- **Effort:** 1h
- **Acceptance criteria:**
  - Zero diff on any `TERMS` or `PRIVACY` clause text in `src/data/legal.ts`.
  - `/terms` remains `noindex, nofollow` and excluded from `sitemap.xml`.
  - `/404` links to `/`, `/services`, and `/contact` cleanly at `375px` and `1440px`.
- **Verify after release:** `git diff src/data/legal.ts` (verify only meta/title/intro fields touched) + `npm run build && npm run headings && npm run links`.

---

## Planned

### T-8 — [x] Investigation & Context for Logos, Testimonials & Project Cards (Value: High · Reach: `/` · Effort: 2h · Risk: Medium)
- **Where:** `src/data/company-logos.ts`, `src/data/projects.ts`, `src/data/testimonials.ts`, `src/components/CaseStudies.astro`, `src/components/Testimonials.astro`
- **What (Investigation + Copy):**
  - **Questions to answer (`V-2`, `V-3`, `V-4`):**
    1. How is Decbricks connected to the 12 logos in `COMPANY_LOGOS` (direct clients vs team background vs community)?
    2. Are all 6 testimonials in `src/data/testimonials.ts` (especially `"Professional"` at `Tata Steel` / `Amgen` and `"Nokia"`) verified & consented for launch, and should the stale placeholder header comment be updated?
    3. Can each of the 4 `PROJECTS` (`Findtern`, `Upcoming Engineer`, `Hackcelerate ’27`, `Developer Students Club`) display a verified 1-sentence scope/outcome summary?
  - Update `COMPANY_LOGOS` `alt` text to `"<Company> logo"` and add approved section context once confirmed (or mark `[VERIFY]` in copy/docs).
- **Who:** Owner + Content & SEO Engineer
- **Effort:** 2h (after owner answers)
- **Acceptance criteria:**
  - Zero unverified client claims on `/`; every logo group and testimonial quote has explicit verified framing; all `<img>` `alt`s follow `decbricks-copy` (1 short descriptive sentence or `""` for decorative).
- **Verify after release:** `npm run check:placeholders && npm run build` + inspect `CaseStudies` and `Testimonials` in Playwright.

### T-9 — [x] Shared Chrome Microcopy Polish (Value: Medium · Reach: All Pages · Effort: 1h · Risk: Low)
- **Where:** `src/data/footer.ts`, `src/components/footer/FooterCta.astro`, `src/components/footer/FooterContact.astro`, `src/components/CookieBanner.astro`
- **What:**
  - Standardise CTA phrasing across `FooterCta` (`"Start a project"`, `"Book a call"` — `open-items.md` A19), ensure British/Indian English spelling across shared UI (`CookieBanner.astro` `"We're using cookies..."` / policy wording aligned with `/terms#privacy-policy`), and add a direct link from `CookieBanner` `"Cookie Policy"` text to `/terms#privacy-policy` if helpful.
- **Who:** Frontend / Content Engineer
- **Effort:** 1h
- **Acceptance criteria:**
  - Consistent CTA wording and British/Indian English across header, footer, and cookie banner; all tap targets remain `>= 44px` and no layout shifts introduced.
- **Verify after release:** `npm run build && npm run check:footer` + Playwright visual check on header, footer, and cookie banner at `375px` and `1440px`.

---

## What Not To Do Now

- Do **not** add `Service` or `Review`/`AggregateRating` JSON-LD to `/` or Testimonials while `T-1`, `T-3`, and `V-3` are unresolved (Google prohibits self-serving organization review rich snippets and `/` is a brand overview, not a dedicated service detail page).
- Do **not** create programmatic city/service landing pages (e.g. `/services/ai-automation-chennai`) or a blog before the 4 core indexable pages have unique, verified copy and baseline Google Search Console impression data.
- Do **not** flip `PUBLIC_ENV=production` or add `/terms` to `sitemap.xml.ts` until `T-1`..`T-7`, `V-1`..`V-9`, and `docs/open-items.md` §E launch gates are resolved.
- Do **not** rewrite `TERMS` or `PRIVACY` clauses in `src/data/legal.ts` or alter any CSS hooks/motion timelines while doing copy updates.
