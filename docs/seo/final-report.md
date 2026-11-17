# Decbricks SEO — Final Report (Phases 0–6)

**Date:** 17 Nov 2026 · **Scope:** site-wide SEO programme on the completed Decbricks build.
**Positioning source of truth:** `.agents/product-marketing.md` · **Owner decisions:** `docs/seo/verify-list.md` (V-10…V-18) and `docs/content-seo/verify-list.md` (V-1…V-9).

No promises: nothing in this programme guarantees rankings, traffic or enquiries. Every item below
describes a mechanism and a metric to watch (GSC reports, GA4 events). The site stays honest: no
invented facts ship anywhere (`check:placeholders`, `seo:check` banned-strings, and grep gates enforce it).

---

## 1. What shipped

| Phase | Deliverable | Where |
|---|---|---|
| 0 | Context & assumptions | `docs/seo/00-context.md` |
| 1 | Code audit — 17 findings (F-1…F-17) | `docs/seo/01-code-audit.md` |
| 2 | Rendered audit of all 6 routes + per-page cards | `docs/seo/02-rendered-audit.md`, `docs/seo/pages/*.md` |
| 3 | Strategy: architecture, content plan, AI search, measurement, off-site, programmatic verdict | `docs/seo/03…09-*.md` |
| 4 | Fix plan (12 tickets), implementation plan, `npm run seo:check` dist checker + baseline | `docs/seo/10…12-*.md`, `scripts/seo-check.mjs` |
| 5 | Implementation (see §2) | commits `232d9ab`…`1975d0e` |
| 6 | Final gates + this report | this file |

## 2. Phase 5 implementation (after owner review-gate approval)

Owner decisions first: **T-7 (`/services/ai-automation`) and T-8 (case-study pages) dropped** — new
pages not required; **T-9 closed** — OG emblem card kept (V-14); **T-10 = GTM container
`GTM-MRLF44ZP`**; V-11/V-12/V-13/V-15/V-17/V-18 closed "not required"; AI-crawler policy = allow
(Option A — no robots change beyond the launch gate); competitor set for the off-site layer:
1minus1.com, gapsystudio.com, studiomoara.com.

| Ticket | What changed | Verification |
|---|---|---|
| T-2 ✅ | `scripts/seo-check.mjs` + `npm run seo:check` (dist checker, Phase 4) | baseline in `12-baseline.md`; smoke-tested failure modes |
| T-3 ✅ | Sitemap `lastmod` from each route file's last git commit (`node:child_process`, today-fallback for shallow CI clones) | built sitemap dates match `git log --format=%cs` per file; fallback path exercised |
| T-4 ✅ | Removed stale `departure-mono` preload (audit F-11; supersedes perf-phase ND-6) | no preload in built HTML; face still loads on use (`document.fonts.check` live) |
| T-5 ✅ | Hero "Book a call" CTAs render `href="/contact#book-a-call"` (no-JS/crawler fallback); `cal-modal.ts` `preventDefault()` keeps modal behaviour identical | Playwright: modal opens as before (`cal-modal-box state=loaded`), URL unchanged |
| T-6 ✅ | "How we scope and price" closing section on `/services`, reusing `AboutBlock`; every fact traced to `legal.ts`, live `/contact` copy, `.agents/product-marketing.md` | all gates pass; Playwright 1440/375 no overflow; no `[VERIFY]` in copy |
| T-10 ✅ | Consent-gated GTM loader (`src/scripts/analytics.ts`, `PUBLIC_GTM_ID`, prod-builds only) + events: `contact_form_submitted` (confirmed success), `booking_started`/`booking_completed` (Cal lifecycle), SPA `page_view` | declined → **zero** googletagmanager requests across a SPA swap; consent → GTM loads, real Formspree test POST → event with `gtm.uniqueEventId`; `booking_started` on calendar mount |
| T-11 ✅ | sr-only H1s naturalised: `/services` → "Our services and expertise"; `/about` → "About Decbricks: our purpose and values". Post-GSC title/description review stays scheduled (Weeks 4–12) | `headings`/`check:brand` pass |
| T-1 ⏳ | Launch-gate flip — **owner-executed**; see §3 checklist | `seo:check` ready to verify the production build |
| T-12 ⏳ | OG/social parity spot-check after launch (shares the T-1 verification pass) | Facebook Sharing Debugger post-launch |
## 3. Launch-day checklist (owner, ~30 minutes)

1. Set `PUBLIC_ENV=production` in the hosting build environment (this enables indexing + `Allow` robots).
   Also confirm: `PUBLIC_CONTACT_ENDPOINT`, `PUBLIC_GSC_VERIFICATION` (or DNS verification), `PUBLIC_GTM_ID`.
2. Verify with `curl -I`: `https://www.decbricks.com` → 301 to `https://decbricks.com`; unknown URL → 404 status.
3. `curl https://decbricks.com/robots.txt` → `Allow` + `Sitemap:` line.
4. `npm run build && npm run seo:check` on the production build → PASS with no launch-gate warnings.
5. GSC: submit `https://decbricks.com/sitemap.xml`; URL Inspection on `/`, `/about`, `/services`, `/contact`.
6. One real test form submission + confirm it arrives in Formspree; one test booking; check both
   appear in GA4 DebugView (`booking_completed` needs a real booking — `booking_started` fires on calendar mount).
7. Share `/` + `/contact` in Facebook Sharing Debugger / validator (T-12) and confirm the OG emblem card renders.
8. **Before launch:** update the Privacy Policy cookies bullet (source `docs/decbricks-legal.docx`,
   then regenerate `src/data/legal.ts`) — it currently states "We do not use analytics or advertising
   cookies", which the consent-gated GTM container (A10) makes false (open-items A11).

## 4. What to watch (no expectations attached)

- **GSC** (4–8 weeks): Pages report (only acceptable exclusions: `/terms`, 404s), Performance
  (query themes vs `00-context.md`), Core Web Vitals (field data only), Links baseline.
- **GA4** (with GTM): `contact_form_submitted` and `booking_completed` as primary conversions;
  `booking_started`, SPA `page_view`, and the AI-assistants channel as secondary signals.
- **Copy iterations:** revisit titles/descriptions only once real query data exists (T-11 second half).

## 5. Deliberately not done (and why)
- **No blog, no programmatic pages, no `/pricing.md`, no llms.txt** — thin early content dilutes the
  four strong pages; re-entry conditions documented in `09-programmatic.md` / `06-ai-search.md`.
- **No `Review`/`AggregateRating` schema** — no third-party review content exists; self-serving markup is prohibited.
- **No link outreach / directory submissions yet** — Layer 1 profile consistency is the prerequisite (V-15 closed "not required" — earned-mention layer stays deferred).
- **No GBP / `LocalBusiness` schema** — owner: no office yet (V-13).
- **No AI-crawler robots restrictions** — Option A (allow) stands; revisit with B if owner wants later.
- **No changes to legal text on `/terms`** — title/meta/structure only (constraint honoured).
- **`cta_clicked` event** from the measurement plan §C was not wired (scope kept to the T-10 file list); the hook points exist if the owner wants it later.

## 6. Verification summary (final battery, this build)

`npm run build` ✅ · `npm run check` 0 errors ✅ · `npm run seo:check` PASS ✅ · `npm run headings`
(one H1 per page, no level jumps) ✅ · `npm run check:brand` ✅ · `npm run links` ✅ ·
`npm run check:placeholders` ✅ · `npm run check:footer` ✅ · `npm run audit`(unused-gate check) — not part of this programme.
Playwright evidence: `docs/seo/screenshots/phase5-*.png` (Cal modal, scope section at 1440/375, form success).

## 7. Open items handed to the owner

- Launch-gate flip + §3 checklist (T-1).
- GTM container: map the pushed event names to GA4 tags (see `docs/open-items.md` A10) and confirm DebugView events.
- FK Raster web-embedding licence confirmation (open-items B1 — pre-existing, launch-critical).
- Off-site layer (07): profile consistency is skipped per owner; earned-mention work (competitor set
  recorded in `verify-list.md`) resumes only on owner request.

## 8. Final review outcome (fresh-context reviewer on the whole Phase 5 range)

- **No Critical findings.** Consent gating, sitemap logic, schema parity and fact-tracing verified clean.
- **Important 1 (fixed):** consent withdrawal now stops the container — revoking analytics clears the
  consent cookies and reloads (mirrors the banner's own revoke path), so the fresh document boots
  without GTM; verified live (script + `dataLayer` gone, banner re-asks). Commit `bc385fa`.
- **Important 2 (owner action, launch-blocking disclosure fix):** Privacy Policy §2 contradicts the
  GTM container ("We do not use analytics cookies") — code cannot touch verbatim legal text; recorded
  in open-items A11 and §3 checklist item 8.
- **8 Minors deferred (ledgered, owner may request):** ctrl/cmd-click on the hero CTA opens the modal
  instead of a background tab; sitemap `lastmod` ignores data-file-only commits; shallow-clone lastmod
  degrades silently (no warn); modal booking path emits no events; gtag-style GTM bootstrap instead of
  the `gtm.js`-event push; `page_view` double-count risk if GA4 auto-tracking is on; `booking_started`
  re-fires per SPA revisit; one comment overstates the preview guarantee.
- Full report in the review package: `.superpowers/sdd/11-implementation-plan/review-bb8d57d..1975d0e.diff` + reviewer output.
