# Decbricks Copy and Content-SEO Implementation Plan

**Goal:** Deliver unique, verifiable, visitor-first copy, titles, meta descriptions, internal links, and matching JSON-LD across all Decbricks routes without changing palette, fonts, layout, or motion.
**Architecture:** Page routes in `src/pages/*.astro` inherit `<head>`, canonical, OG/Twitter tags, `robots`, and `<script type="application/ld+json">` from `src/layouts/Base.astro` and `src/lib/schema.ts`. Structured copy lives in `src/data/*.ts`, shared UI copy lives in `src/components/*.astro`, and every visible `"Decbricks"` mention in body markup runs through `brandify()` (`src/lib/brand.ts`).
**Tech Stack:** Astro 5 (`^5.0.0`), TypeScript (`^5.9.3`), GSAP (`^3.15.1`), Lenis (`^1.3.27`), Three.js (`^0.187.0`), static pre-compiled `src/styles/global.css` + `src/styles/decbricks.css`, Formspree, Cal.com inline/modal embed, Playwright verification scripts.
**Spec:** `docs/content-seo/fix-plan.md`, `docs/content-seo/topic-map.md`, `.agents/skills/decbricks-copy/SKILL.md`

## Global Constraints

- Palette, fonts, spacing, layout and component structure stay as they are. Change copy, headings, meta and content blocks. Touch CSS only when new copy cannot fit without it, and say so in the task.
- The brand name "Decbricks" keeps its existing treatment (logo before the name, FK Raster Roman Compact where the design uses it). In `<title>`, meta and JSON-LD it is plain text: `Decbricks`.
- No invented facts. Every client name, number, award, testimonial, location or result must already exist in the repo (`docs/about-section-data.md`, `docs/services-content.md`, components, content files — note `docs/decbricks-content-updated.md` is absent from the repo). Anything else is marked `[VERIFY: what is needed]` in the copy and listed in `docs/content-seo/verify-list.md`. This includes the "award-winning" claim on the home hero: keep it only if the repo supports it, otherwise flag it.
- Legal pages (Terms of Service, Privacy Policy): do not rewrite the legal text. You may fix their `<title>`, meta description and heading structure only.
- Contact form, Formspree, Cal.com embed and booking behaviour are unchanged.
- Spelling is British/Indian English throughout (organisation, customised), matching the Terms.
- No new dependencies. No promises about rankings or traffic in any document you write.
- Commit after each task with a message of the form `copy(<page>): <what changed>`. Skip the commit step if the project is not a git repo.

## Review Focus

- **Unverified claims entering copy or schema** (`award-winning`, unclarified company logos, `V-1`–`V-9`) — pinned by tracing every fact to `docs/content-seo/verify-list.md` and running `npm run check:placeholders` in Tasks 2, 3, and 4.
- **Heading edits breaking CSS/JS hooks or heading hierarchy** (`Hero.astro` `h2` before `h1`, `CaseStudies.astro` duplicate `h2`) — pinned by `npm run headings` and `grep` hook audit in Tasks 2, 7, and 8.
- **Longer copy overflowing containers or colliding with cookie banner/sidebar at 375 px** — pinned by Playwright `375 px` and `1440 px` screenshots (`scrollWidth <= innerWidth`, zero clipped text) in Tasks 2–9.
- **Duplicate titles/meta descriptions or stale JSON-LD across `Base.astro` and `schema.ts`** — pinned by inspecting `dist/**/*.html` `<title>`, `<meta name="description">`, `<link rel="canonical">`, and JSON-LD parse checks in Tasks 1, 2, 4, 5, 6, 7, and 8.
- **Accidental edits to legal clauses or indexing of `/terms`** — pinned by `git diff src/data/legal.ts` (clauses untouched) and verifying `noindex, nofollow` + `sitemap.xml` exclusion in Task 7.

---

## Tasks

### Task 1 (Ticket T-2) — Shared Layout & JSON-LD Foundation
- **Files:** `src/layouts/Base.astro`, `src/lib/schema.ts`, `src/data/site.ts`, `src/pages/404.astro`
- **Interfaces:** `SITE` (`src/data/site.ts`) feeds `Base.astro` default meta/OG and `schema.ts` `organizationSchema()` / `webSiteSchema()`. `Base.astro` `Props` (`title`, `description`, `canonical`, `schema`, `noindex`) are consumed by every page in Tasks 2, 4, 5, 6, 7, and 8.
- **Steps:**
  1. Refine `SITE.description` in `src/data/site.ts` using `.agents/skills/decbricks-copy/SKILL.md` (140–155 chars, single active sentence, plain-text `Decbricks`, `[VERIFY]` if anything lacks a source) and sync `SITE.nav` `enabled` flags with live routes.
  2. Update `src/layouts/Base.astro` and `src/lib/schema.ts` so every indexable page receives `Organization` + `WebSite` JSON-LD (via shared helper or per-page arrays), `Service` JSON-LD stays restricted to `/services`, and `noindex` pages (`/terms`, `/404`) suppress `<link rel="canonical">` if appropriate without breaking existing props.
  3. Run `npm run build && npm run check && npm run check:footer`. Expected: 0 errors, valid JSON-LD across all built pages.
  4. Using Playwright MCP, load `/` and `/services` at `375 px` and `1440 px`, verify `<head>` tags and screenshot both. Expected: no overflow, no overlapping text, no console errors.
  5. Check `T-2` acceptance criteria and tick `T-2` in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(shared): align Base meta defaults and site-wide JSON-LD`.

### Task 2 (Tickets T-1, T-3) — Home Page (`/`)
- **Files:** `src/pages/index.astro`, `src/components/Hero.astro`, `src/components/CaseStudies.astro` (headings only)
- **Interfaces:** `index.astro` passes explicit `title`, `description`, `ogTitle`, `ogDescription`, `canonical="/"` and `[organizationSchema(), webSiteSchema()]` to `Base.astro`. `Hero.astro` reads `SERVICES` (`homeSummary`, `homeTags`) from `src/data/services.ts` (updated in Task 4). `src/scripts/hero.ts` queries `.sections-hero__heading`, `.parts-smileyText`, `.hero-bookCallBtn`; `src/scripts/case-studies.ts` queries `#work` and `.parts-caseStudyCard`.
- **Steps:**
  1. Rewrite `Hero.astro` `<h1>`, smiley intro (`parts-smileyText`), and showreel description using `decbricks-copy` (first 100 words state what Decbricks builds, for whom, and primary CTA `"Book a call"`; keep `"award-winning"` omitted per `V-1`); fix `Hero.astro` so `<h2 id="hero-heading">` does not precede `<h1>`, and remove the duplicate `sr-only` `<h2>Our Work</h2>` in `CaseStudies.astro` (keeping a space between `"Our"` and `"Work"` for screen readers).
  2. Pass a unique topic-first `<title>` ending `| Decbricks` (50–60 chars) and unique 140–155 char meta description in `src/pages/index.astro` (matching `ogTitle`/`ogDescription` and JSON-LD).
  3. Run `npm run build && npm run check && npm run headings && npm run check:brand`. Expected: 0 errors, 1 `<h1>`, no heading skips, 0 brand leaks.
  4. Using Playwright MCP, screenshot `/` at `375 px` and `1440 px` (hero + `#services` + `#work`). Expected: no overflow, no overlapping text, animations intact.
  5. Check `T-1` (Home) and `T-3` (Home) criteria and tick in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(home): clarify hero positioning, fix headings and unique meta`.

### Task 3 (Ticket T-8) — Home Logos, Projects & Testimonials Context
- **Files:** `src/data/company-logos.ts`, `src/data/projects.ts`, `src/data/testimonials.ts`, `src/components/CaseStudies.astro`, `src/components/Testimonials.astro`
- **Interfaces:** `CaseStudies.astro` consumes `COMPANY_LOGOS` and `PROJECTS`; `Testimonials.astro` consumes `TESTIMONIALS` and `hasPlaceholderTestimonials`. `src/scripts/case-studies.ts` and `src/scripts/testimonials.ts` depend on `.parts-caseStudySlider` and `.tst-*` hooks (keep unchanged).
- **Steps:**
  1. Apply owner decisions for `V-2`, `V-3`, and `V-4` (or insert `[VERIFY]` markers in `docs/content-seo/verify-list.md` / `CaseStudies.astro` / `Testimonials.astro`); refine `COMPANY_LOGOS` `alt` text (`"<Company> logo"`), confirm `PROJECTS` `alt`s follow 1-sentence `decbricks-copy` style, and update the stale placeholder header comment in `testimonials.ts` if owner confirms all 6 entries.
  2. Verify `CaseStudies.astro` section heading/intro copy and `Testimonials.astro` kicker/title match visible verified proof without adding `Review` JSON-LD.
  3. Run `npm run build && npm run check && npm run check:placeholders && npm run check:brand`. Expected: 0 errors.
  4. Using Playwright MCP, screenshot `#work` and `#testimonials` at `375 px` and `1440 px`. Expected: no overflow, no overlapping text, ticker/carousel interactive.
  5. Check `T-8` acceptance criteria and tick `T-8` in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(home): refine client proof alts and context`.

### Task 4 (Tickets T-1, T-3, T-4) — Services Page (`/services`) & `services.ts`
- **Files:** `src/data/services.ts`, `src/pages/services.astro`, `src/components/ServiceBlock.astro`, `src/components/Hero.astro` (CTA label sync)
- **Interfaces:** `SERVICES` in `src/data/services.ts` supplies both `/services` (`ServiceBlock.astro` + `servicesPageSchema()`) and `/` (`Hero.astro` `homeSummary`, `homeTags`). `ServiceBlock.astro` links to `/contact?service={service.id}`. `src/scripts/services-page.ts` queries `#services` anchors and `.parts-serviceBlock`.
- **Steps:**
  1. Rewrite `SERVICES[i].homeSummary` in `src/data/services.ts` so `/` cards offer distinct 1-sentence buyer previews rather than duplicating `paragraphs[0]`; refine `SERVICES_HERO`, `ServiceBlock` paragraphs, and `alt` texts via `decbricks-copy` (British/Indian English, active voice, concrete nouns, `V-5` metrics verified or marked `[VERIFY]`); make Home `"Find Out More"` CTA accessible names descriptive (`Explore {service.title}`).
  2. Update `<title>` (50–60 chars ending `| Decbricks`), meta description (140–155 chars), OG tags, and `servicesPageSchema(description)` in `src/pages/services.astro` (plus an `<h1>` aligned with `<title>`).
  3. Run `npm run build && npm run check && npm run headings && npm run check:brand && npm run links`. Expected: 0 errors, `Service` JSON-LD matches visible blocks.
  4. Using Playwright MCP, screenshot `/services` (hero + service cards) and `/` `#services` at `375 px` and `1440 px`. Expected: no overflow, no overlapping text.
  5. Check `T-3` (Services) and `T-1` (`/services`) criteria and tick in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(services): differentiate summaries, tighten descriptions and meta`.

### Task 5 (Tickets T-1, T-5) — About Page (`/about`)
- **Files:** `src/data/about.ts`, `src/pages/about.astro`
- **Interfaces:** `ABOUT` (`src/data/about.ts`) feeds `AboutBlock.astro` and `FooterNav` (`companyLinks` via `id`/`navLabel` in `src/data/footer.ts` — keep `id`s and `navLabel`s intact). `about.astro` passes `title`, `description`, `canonical="/about"`, `aboutPageSchema(description)` to `Base.astro`.
- **Steps:**
  1. Restore the omitted opening sentence of `docs/about-section-data.md` into `ABOUT[0]` (per `AGENTS.md` rule 5 verbatim rule and `V-7`), preserve all 7 verbatim `ABOUT` sections, update `ServicesHero` body on `/about` from `ABOUT[0]`, and add descriptive contextual links from `/about` to `/services` and `/contact` (`Explore our seven services`, `Start a project`).
  2. Update `title` (50–60 chars ending `| Decbricks` pending `V-8` approval, else `About Decbricks | Digital & Technology Solutions Agency`), unique 140–155 char `description` (no `/` duplication), `srTitle` (`<h1>`), and `aboutPageSchema(description)` (+ `webSiteSchema()` per Task 1) in `src/pages/about.astro`.
  3. Run `npm run build && npm run check && npm run headings && npm run check:brand && npm run links`. Expected: 0 errors.
  4. Using Playwright MCP, screenshot `/about` at `375 px` and `1440 px` (hero + `#who-we-are` + `#philosophy`). Expected: no overflow, no overlapping text.
  5. Check `T-5` and `T-1` (`/about`) criteria and tick in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(about): restore verbatim opening, add service links and unique meta`.

### Task 6 (Tickets T-1, T-4, T-6) — Contact Page (`/contact`) & `?service=` Pre-fill
- **Files:** `src/pages/contact.astro`, `src/components/CalEmbed.astro`, `src/components/ContactForm.astro`, `src/scripts/contact.ts`
- **Interfaces:** `ServiceBlock.astro` links to `/contact?service={service.id}`; `contact.ts` hydrates `.sections-contactForm form` and preserves Formspree `FormData` fields (`email`, `name`, `company`, `message`, `_subject`, `source_page`, `_gotcha`). `CalEmbed.astro` mounts `cal-embed.ts` on `.cal-embed[data-lenis-prevent]`.
- **Steps:**
  1. Replace `heroBody` in `src/pages/contact.astro` (currently identical to meta description) using `decbricks-copy`, align `bookingChips` duration (`V-6` — confirm `15m/25m/40m` vs `30m/1h` or mark `[VERIFY]`), break `startProjectBody` into clear scannable steps with links to `/services` and `/about`, refine `ContactForm.astro` / `CalEmbed.astro` microcopy, and wire `?service=` query-param reading in `src/scripts/contact.ts` to prefill a polite starter line in `#message` when empty.
  2. Update `<title>` (50–60 chars ending `| Decbricks`), meta description (140–155 chars), OG tags, `srTitle` (`<h1>`), and `contactPageSchema(description)` (+ `webSiteSchema()`) in `src/pages/contact.astro`.
  3. Run `npm run build && npm run check && npm run headings && npm run check:brand && npm run links`. Expected: 0 errors.
  4. Using Playwright MCP, screenshot `/contact` (hero + Cal block + `#start-a-project` + form) at `375 px` and `1440 px`, and verify `/contact?service=ai-automation` pre-fill. Expected: no overflow, no overlapping text, Cal.com/Formspree intact.
  5. Check `T-6`, `T-4` (`?service=`), and `T-1` (`/contact`) criteria and tick in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(contact): distinct hero intro, scannable process and service prefill`.

### Task 7 (Ticket T-7, Legal) — Terms of Service & Privacy Policy (`/terms`)
- **Files:** `src/data/legal.ts`, `src/components/LegalPage.astro`
- **Interfaces:** `src/pages/terms.astro` passes `TERMS_DOC` (`src/data/legal.ts`) into `LegalPage.astro`, which passes `seoTitle`, `seoDescription`, `canonical="/terms"`, `noindex={true}` to `Base.astro`.
- **Steps:**
  1. Without altering any word of `TERMS`, `PRIVACY`, or `preamble` / `privacy.preamble`, update `TERMS_DOC.seoTitle` (50–60 chars ending `| Decbricks`), `TERMS_DOC.seoDescription` (140–155 chars), and `TERMS_DOC.title` (`<h1>`) so it reflects both Terms of Service and Privacy Policy (`Terms of Service & Privacy Policy`).
  2. Verify `Base.astro` receives `noindex={true}` and `sitemap.xml.ts` continues to exclude `/terms`.
  3. Run `git diff src/data/legal.ts` (verify clauses untouched), `npm run build && npm run check && npm run headings && npm run check:brand`. Expected: 0 errors.
  4. Using Playwright MCP, screenshot `/terms` at `375 px` and `1440 px`. Expected: no overflow, no overlapping text.
  5. Check `T-7` (Legal) criteria and tick in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(terms): update legal page title, meta description and H1 only`.

### Task 8 (Ticket T-7, 404) — 404 Error Page (`/404`)
- **Files:** `src/pages/404.astro`
- **Interfaces:** Passes `title`, `description`, `robots="noindex, nofollow"`, `noindex={true}` to `Base.astro`. Uses `Header.astro` and `Footer.astro`.
- **Steps:**
  1. Rewrite the `/404` recovery message using `decbricks-copy` and add a `"Contact Us"` recovery button alongside `"Back to Home"` and `"Our Services"` (keeping existing `.part-btnPrimary` markup so tap targets remain `>= 44 px`).
  2. Update `<title>` (50–60 chars ending `| Decbricks`, e.g. `Page Not Found — Explore Services | Decbricks`), `description` (140–155 chars), and keep `noindex={true}`.
  3. Run `npm run build && npm run check && npm run headings && npm run links`. Expected: 0 errors.
  4. Using Playwright MCP, screenshot `/404` at `375 px` and `1440 px`. Expected: buttons wrap cleanly, no overflow, no overlapping text.
  5. Check `T-7` (404) criteria and tick in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(404): refine error recovery copy, meta and contact route`.

### Task 9 (Tickets T-4, T-9) — Shared Chrome (Footer, Header, Cookie Banner)
- **Files:** `src/data/footer.ts`, `src/components/footer/FooterCta.astro`, `src/components/CookieBanner.astro`
- **Interfaces:** `FOOTER` (`src/data/footer.ts`) feeds `Footer.astro`, `FooterNav.astro`, `FooterCta.astro`, `FooterLegal.astro`, and `scripts/check-footer-schema.mjs`. `CookieBanner.astro` hooks into `src/scripts/cookies.ts` (`data-cookie*` attributes — keep unchanged).
- **Steps:**
  1. Populate `FOOTER.columns` (`services`) in `src/data/footer.ts` (linking to `/services` + top service anchors) so the Services column renders cleanly in `FooterNav.astro`; align `FOOTER.cta` labels with `open-items.md` A19 and tighten `CookieBanner.astro` copy in British/Indian English (adding a link to `/terms#privacy-policy` if layout permits without height shift).
  2. Verify `FooterCta.astro` and `FooterContact.astro` remain aligned with `SITE` and `organizationSchema()` (`npm run check:footer`).
  3. Run `npm run build && npm run check && npm run check:brand && npm run links && npm run check:footer`. Expected: 0 errors; check footer grid wrapping in CSS.
  4. Using Playwright MCP, screenshot the footer and open cookie banner at `375 px` and `1440 px`. Expected: no overflow, 44 px tap targets preserved, no overlap.
  5. Check `T-4` (footer) and `T-9` criteria and tick in `docs/content-seo/fix-plan.md`.
  6. Commit: `copy(chrome): add footer services links and polish cookie microcopy`.

---

## Self-Review Check

- **Ticket coverage:** `T-1` → Tasks 2, 4, 5, 6 · `T-2` → Task 1 · `T-3` → Tasks 2, 4 · `T-4` → Tasks 4, 5, 6, 9 · `T-5` → Task 5 · `T-6` → Task 6 · `T-7` → Tasks 7, 8 · `T-8` → Task 3 · `T-9` → Task 9. Every ticket has a task.
- **Single-action steps:** Every step specifies one concrete operation (copy/meta/build/screenshot/tick/commit).
- **Path & symbol consistency:** All paths (`Base.astro`, `schema.ts`, `site.ts`, `services.ts`, `about.ts`, `legal.ts`, `contact.astro`, `404.astro`, `footer.ts`, `CookieBanner.astro`) verified against repo files; absent `decbricks-content-updated.md` noted explicitly.
- **Review Focus tests:** Every Review Focus risk is pinned to an automated script (`check:placeholders`, `headings`, `check:brand`, `check:footer`, `links`), `git diff`, or Playwright `375 px`/`1440 px` check.
- **Scope discipline:** 9 tasks match 9 tickets with zero extra features or CSS redesigns.
