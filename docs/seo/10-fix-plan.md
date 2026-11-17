# Decbricks SEO Fix Plan

**Goal:** qualified enquiries and booked calls from organic search — unblock indexing, then build the depth that earns it. **Critical: 1 · Quick wins: 4 · Planned: 7 (12 tickets).**

Builds on: the technical audit (`01-code-audit.md`), rendered audit (`02-rendered-audit.md`) and the completed copy pass (`docs/content-seo/`). Findings shared one fix are merged.

---

> **Review-gate update (2026-11-17):** owner approved Phase 5 with these changes — T-7 and T-8 **dropped** (new pages not required); T-9 **closed, no change** (emblem OG card kept, V-14); T-10 tool = **GTM container `GTM-MRLF44ZP`**, consent-gated. V-11/V-12/V-13/V-15/V-17/V-18 closed "not required" — see `verify-list.md`.

## Critical

### T-1 — [ ] Production launch gate + environmental verification
The site cannot be indexed at all today (`PUBLIC_ENV` unset → site-wide `noindex, nofollow` + `Disallow: /`). Every other ticket is worthless before this ships correctly.
- **Where:** build/deploy environment (owner), verification script touches `scripts/seo-check.mjs`; host config (not in repo).
- **What:** set `PUBLIC_ENV=production` on the production build; verify (a) `https://www.decbricks.com` and `http://decbricks.com` 301 → `https://decbricks.com`; (b) unknown URLs return HTTP 404 status serving `dist/404.html`; (c) the contact form endpoint is set and one real test submission arrives; (d) `PUBLIC_GSC_VERIFICATION` (or DNS verification) present; (e) Cal link set; (f) built robots.txt is `Allow` + Sitemap line and no page ships noindex except `/terms`.
- **Who:** Owner + Frontend/SEO engineer.
- **Effort:** 0.5 d (+ owner actions).
- **Acceptance criteria (observable):** `curl -I https://www.decbricks.com` → 301 to apex; `curl -I https://decbricks.com/nonexistent` → 404; `curl https://decbricks.com/robots.txt` → Allow + Sitemap; `npm run seo:check` passes with no "unintended noindex" failures on a production build.
- **Verify after release:** GSC URL Inspection on the four indexable routes.

## Quick wins

### T-2 — [x] `scripts/seo-check.mjs` + `npm run seo:check` (Task 1 of the implementation plan) *(done in Phase 4 — baseline in `12-baseline.md`)*
- **Where:** `scripts/seo-check.mjs` (new, parse5), `package.json` script.
- **What / acceptance / verify:** see `11-implementation-plan.md` Task 1; runs against `dist/`, fails on duplicated titles/descriptions, bad canonicals, unintended noindex, unparseable JSON-LD, dead internal links, images without alt, HTML > 1.5 MB, banned strings, sitemap/indexation mismatches. Baseline run recorded in `12-baseline.md`.
- **Who:** Frontend engineer. **Effort:** 0.5 d.

### T-3 — [ ] Sitemap `lastmod` from git history, not build date
- **Where:** `src/pages/sitemap.xml.ts:13` — `const lastmod = new Date().toISOString().slice(0, 10);`
- **What:** per-URL date from the route file's last git commit (`node:child_process` at build, zero new deps), falling back to the current date when git is unavailable (e.g. CI shallow clone).
- **Acceptance:** lastmod matches each page file's last content commit; sitemap still lists the four indexable URLs.
- **Who:** Frontend engineer. **Effort:** 1 h.

### T-4 — [x] Remove the Departure Mono font preload (or re-record the decision) *(done Phase 5 — commit `a4df59e`)*
- **Where:** `src/layouts/Base.astro:118`.
- **What:** the `@font-face` uses `src: local("Departure Mono")` first and the shipped decision (`PROGRESS.md` 2026-11-11) says it is fallback-only and not preloaded — but it still preloads. Remove the preload line; if a first-paint mono usage is later proven, re-add consciously and update PROGRESS.
- **Acceptance:** no Departure Mono preload in built HTML; `npm run check` and visual spot-check unchanged.
- **Who:** Frontend engineer. **Effort:** 15 min.

### T-5 — [x] Give the hero "Book a call" CTA an `href` fallback (progressive enhancement) *(done Phase 5 — verified in browser: click still opens the Cal modal, no navigation)*
- **Where:** `src/components/Hero.astro:54,95` — `href={hasCalLink ? undefined : CAL.bookingUrl || '/contact#book-a-call'}`.
- **What:** render the hero CTA as `<a href="/contact#book-a-call">`; existing JS intercepts the click and opens the Cal modal exactly as today (behaviour for JS visitors unchanged; no-JS visitors get a working destination). Verify the modal-open click handler's `preventDefault` covers the anchor before merging.
- **Acceptance:** rendered anchor has href; clicking with JS opens the modal as before (manual Playwright check); no change to Cal payload/namespace.
- **Who:** Frontend engineer. **Effort:** 1 h. **Constraint note:** booking behaviour unchanged — this only supplies a fallback target.

## Planned (ranked by value · reach · confidence · dependencies · effort · risk)

### T-6 — [x] "How we scope and price" section (facts already in repo) *(done Phase 5 — rendered with reused `AboutBlock`; every fact traced in `src/data/services.ts` `SCOPE_SECTION` comment)*
- **Where:** `/services` (preferred, as a closing block) or `/about`; content from `src/data/legal.ts` (proposal review 5–8 days, 2–3 revision rounds, 14 days post-launch support) and product-marketing engagement models (retainer / milestone / dedicated team). No invented prices.
- **Value:** answers the #1 unvoiced buyer question on the goal pages; reach: all service intent. Confidence: high (facts exist). Deps: none. Effort: 1 d. Risk: low (template component reuse — `AboutBlock`/`ServiceBlock` pattern).
- **Acceptance:** visible section on the page; heading hierarchy intact (`npm run headings`); no `[VERIFY]` in copy.

### T-7 — [~] ~~Service detail page: `/services/ai-automation`~~ DROPPED at review gate (owner: new pages not required)
- **Where:** new `src/pages/services/[service].astro` (or single page); copy drafted in `04-content-plan.md`; schema via a new `serviceDetailSchema()` in `src/lib/schema.ts`; breadcrumb Home › Services › AI Automation; sitemap updated.
- **Value:** first depth page on the highest-differentiator cluster. Reach: AI-intent queries. Confidence: medium (demand unvalidated). Deps: owner approval of new-page decision at the review gate + a verifiable proof line (or ship without proof section). Effort: 2 d. Risk: low-medium (new route → checker guards duplicates/canonicals).
- **Acceptance:** unique title/description (seo:check), one H1, internal links both directions to `/services`, sitemap updated, `?service=` CTA works.

### T-8 — [~] ~~Case-study pages `/work/<project>` + `/work` hub~~ DROPPED at review gate (owner: new pages not required; V-10 outcomes kept on record in `verify-list.md`)
- **Where:** new pages from `src/data/projects.ts` + owner-verified one-sentence outcomes with permission (`[VERIFY]`, V-4 follow-up); links from home `#work` cards (F-9).
- **Value:** crawlable proof — the asset AI engines and vetting buyers can cite. Confidence: medium. Deps: **hard** — no page ships without a verified, publishable outcome per project. Effort: 2 d after owner content. Risk: low.
- **Acceptance:** each page has ≥1 sourced outcome sentence; home cards link to them with project-name anchors; sitemap updated.

### T-9 — [x] Real OG/share image — CLOSED at review gate: owner keeps the emblem card (V-14). No file change.
- **Where:** `public/og-default.png` (currently TEMP brand emblem PNG), `src/data/site.ts:28-32`.
- **What:** designed 1200×630 brand card (owner asset decision); optional per-page OG images later. Effort: owner + 0.5 d integration. Risk: none.

### T-10 — [x] Consent-gated analytics + conversion events (08-measurement; owner chose GTM container `GTM-MRLF44ZP`) *(done Phase 5 — verified: zero GTM requests with consent declined; GTM + page_view + form/booking events on consent; live Formspree test POST succeeded)*
- **Where:** GA4 (or chosen tool) loaded only after the cookie banner's analytics consent (`cookies-decided` bus event, same gate as the Cal embed); events per `08-measurement.md` hooked to the *existing* confirmed-success branches (`contact.ts` success state, `cal-embed.ts` `bookingSuccessful`).
- **Value:** makes GSC queries → enquiries measurable. Deps: owner approval of tool + plan. Effort: 1 d. Risk: medium (must not fire pre-consent; verify test events in DebugView before done).
- **Acceptance:** with consent declined, zero network calls to the analytics origin (DevTools-verified); with consent, one test form submission and one test booking appear as events.

### T-11 — [ ] Copy polish from DOM observations + post-GSC title/description review
- **Where:** H1 compositions reading duplicated ("Our Services: Our Expertise" `/services`, "About Decbricks: Our Purpose" `/about`); revisit titles/descriptions after 4–8 weeks of GSC data (page cards hold alternatives).
- **Acceptance:** `npm run headings` + `check:brand` pass; unique titles preserved. Effort: 0.5 d now + 0.5 d after GSC. Risk: low.

### T-12 — [ ] OG image + `og:locale`/social meta parity check post-launch (light)
- **Where:** `Base.astro` OG tags; verify share rendering (Facebook Sharing Debugger / validator) after T-9. Effort: 0.5 h. Risk: none. *(Merged: shares one verification pass with T-9.)*

---

## What not to do now

- **No blog** until the foundation pages have GSC baseline data (thin early posts dilute the only strong pages).
- **No programmatic/city pages** — `09-programmatic.md` verdict: no, with re-entry conditions.
- **No `Review`/`AggregateRating` markup** — no third-party review content exists; Google prohibits self-serving markup.
- **No `llms.txt` / `/pricing.md`** until real content (pricing ranges, docs) exists to summarise.
- **No AI-crawler robots changes** before the owner decision (`06-ai-search.md`).
- **No link outreach or directory submissions** until Layer 1 profile consistency is done and owner approves each step (`07-offsite-plan.md`).
- **Do not touch Terms/Privacy legal text** — title/meta/structure only (constraint stands).
- **Do not chase word count, meta keywords, heading order or a single-H1 rule beyond accessibility** — explicitly not SEO problems per the brief.
