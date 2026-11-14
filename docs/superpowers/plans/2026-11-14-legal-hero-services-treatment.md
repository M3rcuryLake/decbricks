# Legal Hero → ServicesHero Treatment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legal pages' custom hero with the shared `ServicesHero` treatment and convert all point-style content to prose.

**Architecture:** Reuse `ServicesHero.astro` (prop-driven, as `about.astro` uses it) with two minimal optional-capability additions: a default `<slot />` (for the draft stamp) and a skip-nav-when-`navItems`-is-empty guard. Strip the A2 wall/bricks markup, CSS and motion; re-point `legal-page.ts`'s init guard.

**Tech Stack:** Astro 5 + TS, GSAP (via existing `initServicesPage`), hand-written CSS in `decbricks.css`, Playwright QA scripts under `docs/qa/`.

**Spec:** `docs/superpowers/specs/2026-11-14-legal-hero-services-treatment-design.md`

## Global Constraints

- Copy verbatim: legal text words never change except bullet→paragraph relocation (words identical).
- `noindex`, sitemap exclusion, `data-legal-draft-stamp` visibility: untouched.
- Palette/fonts fixed (AGENTS.md Precedence); "Decbricks" only via `brandify()`.
- Do not rename existing CSS hooks; null-guard every query in touched code.
- New CSS only in `decbricks.css` (compiled `global.css` is frozen).
- Foreign unstaged work must never be staged: `src/pages/contact.astro`, `src/scripts/{hero,media,case-studies,services}.ts`, EOF Mobile-Tilt hunk of `decbricks.css`, Mobile-Tilt hunk of `docs/Design-handoff.md`, untracked `docs/CompanyLogos/`, `docs/favicons/`. Stage `decbricks.css` / `Design-handoff.md` by hunk only.
- Every task ends with: `npm run build` + `npm run check` passing.

## Review Focus

- sr-only h1 must carry the full doc title (h1-based QA depends on it) → Task 1 asserts `h1` textContent contains title.
- Draft stamp must stay visible in the hero slot → Task 1 asserts `[data-legal-draft-stamp]` rendered (not display:none).
- Empty `navItems` must render no "Jump to" heading and no empty list → Task 1 asserts `.parts-servicesHeroNavRow` absent on legal pages.
- `initServicesPage()` becomes live on legal pages — must run clean and survive swaps → Task 1 gauntlet (console clean across `/ → /terms → /privacy-policy → /` + client-side nav).
- Bullet→prose must lose no words → Task 2 asserts no `ul.legal-list` rendered and every former bullet's first+last words present in island text.

---

### Task 1: ServicesHero slot + empty-nav guard; legal hero swap; motion re-guard

**Files:**
- Modify: `src/components/ServicesHero.astro` (add `<slot />` at end of the inner `max-w-1920` container, after the nav-row `div`; wrap the nav-row `div` in `{navItems.length > 0 && (…)}`)
- Modify: `src/data/legal.ts` (add `heroHeading: ['Terms of', 'Service']` / `['Privacy', 'Policy']` to the two docs; extend `LegalDoc` type with `heroHeading: readonly [string, string]`)
- Modify: `src/components/LegalPage.astro` (hero section → `<ServicesHero>`; delete wall/chips/h1/intro markup; move `.legal-progress` div to first child of `.page-legal`)
- Modify: `src/scripts/legal-page.ts` (init guard `.legal-hero` → `.page-legal`; delete the brick build-in block; delete now-unused hero vars)
- Test: `docs/qa/legal-monumental.cjs` (rewrite hero assertions)

**Interfaces:**
- Consumes: existing `ServicesHero` props (`srTitle`, `headingParts`, `body`, `navItems`), `initServicesPage()` null-guards in `main.ts`.
- Produces: `ServicesHero` default slot (empty-safe); `navItems: []` ⇒ no nav row; `LegalDoc.heroHeading`; `legal-page.ts` guarded on `.page-legal`, brick code gone.

- [ ] **Step 1: Rewrite hero assertions in `legal-monumental.cjs` (RED)**

  Replace the Task-1 hero block (heroExists/theme/heroBg/h1/stamp/chips/wallBricks/wallIn) with, per doc (`/terms`, `/privacy-policy`):
  - `.sections-servicesHero` exists, `data-theme="dark"`
  - `h1` count === 1 and its textContent includes the full doc title (sr-only h1)
  - `.parts-smileyText` exists and its text includes `template draft` (the intro subtext)
  - `[data-legal-draft-stamp]` exists, rendered (`offsetParent !== null`), text starts `Last updated:`
  - `.sections-servicesHero__trail` svg exists (flares)
  - `.parts-servicesHeroNavRow` is null (no pills) and `.legal-hero__chip` count === 0 and `.legal-brick` count === 0 (paragraphical, no wall)
  - keep: placeholders ≥ 3, progress hairline 3px, top hidden at top, console clean, 1280 + 375 screenshots, 375 no h-scroll
  Drop the wall-brick build-in motion assertion (Task 3 section): replace "brick build-in caught mid-stagger" + "bricks settle to rest" with a single "smiley + display words visible at rest" check; keep reduced-motion bricks assertion replaced by "smiley visible, sections visible".

- [ ] **Step 2: Run, verify RED** — `node docs/qa/legal-monumental.cjs` → hero fails for the right reasons (no `.sections-servicesHero`, no smiley, stamp hidden/absent).
- [ ] **Step 3: Implement** per Files above. `LegalPage.astro` hero:
  ```astro
  <ServicesHero srTitle={doc.title} headingParts={doc.heroHeading} body={doc.intro} navItems={[]}>
    <p class="legal-hero__stamp" data-legal-draft-stamp>Last updated: {doc.updated}</p>
  </ServicesHero>
  ```
  Island, rail, `legal-top`, Footer unchanged. `legal-page.ts`: `const page = document.querySelector('.page-legal'); if (!page) return () => {};` — hero var removed; keep bar/topBtn/rail/sections/reveal/spy/jumps.
- [ ] **Step 4: Run, verify GREEN** — `legal-monumental.cjs` full pass (rail/motion/gauntlet/375 sections must still pass; gauntlet now also proves `initServicesPage` runs clean on legal pages).
- [ ] **Step 5: Gates** — `npm run build` + `npm run check` + `npm run check:brand`; `node docs/qa/legal-pages.cjs` 29/29 (if the h1 assertion fails because it queried `.legal-hero__title`, fix that assertion to query the generic `h1` and note it in the ledger).
- [ ] **Step 6: Commit** — stage `ServicesHero.astro`, `legal.ts`, `LegalPage.astro`, `legal-page.ts`, `legal-monumental.cjs` (+ `legal-pages.cjs` only if Step 5 touched it) and the Task-1 `.legal-hero__stamp`-related `decbricks.css` hunk if touched; message: `feat: legal heroes adopt the ServicesHero treatment`.

### Task 2: Privacy §2 bullets → prose; dead hero CSS strip

**Files:**
- Modify: `src/data/legal.ts` (privacy section `2. Data we collect`: move each string from `bullets` into `body` in order, delete the `bullets` key)
- Modify: `src/styles/decbricks.css` (delete `.legal-hero`, `.legal-hero__title`, `.legal-hero__intro`, `.legal-hero__chips`, `.legal-hero__chip`, `.legal-hero__wall`, `.legal-brick*` rules; KEEP `.legal-hero__stamp`, `.legal-progress`, `.legal-top`, `.legal-rail*`, `.legal-num`, `.legal-list`)
- Test: `docs/qa/legal-monumental.cjs`

**Interfaces:**
- Consumes: `LegalDoc` unchanged shape (`bullets?` stays optional in the type; no doc uses it now).
- Produces: privacy §2 as body paragraphs; no dead hero CSS.

- [ ] **Step 1: RED** — add to the privacy loop: island renders 0 `ul.legal-list` elements, and the island text contains `Formspree` and `Cal.com` (bullet content preserved as prose). Run → bullet test fails (ul present).
- [ ] **Step 2: Implement** the data transform + CSS deletion (hunk-stage only the legal block edits; never the Mobile-Tilt EOF hunk).
- [ ] **Step 3: GREEN** — `legal-monumental.cjs` full pass; `grep -c 'legal-brick' src/styles/decbricks.css` → 0.
- [ ] **Step 4: Gates + commit** — build/check/check:brand; stage `legal.ts`, `decbricks.css` (legal hunks), `legal-monumental.cjs`; message: `feat: privacy data collection section as prose; drop dead hero styles`.

### Task 3: Full regression, gates, docs

**Files:**
- Run: all suites
- Modify: `docs/PROGRESS.md`, `docs/Design-handoff.md` (own section only, hunk-staged), `docs/mapping.md`, `docs/qa/findings.md`

- [ ] **Step 1: Suites** — `legal-monumental.cjs`, `legal-pages.cjs` (29/29), `contact-tick.cjs` (12/12), `contact-form-matrix.cjs` (50/50).
- [ ] **Step 2: Gates** — build (7 pages), check (0 err), check:brand, headings, links, check:placeholders, check:footer; dist: noindex on both legal pages, sitemap excludes them.
- [ ] **Step 3: Visual review** — read `docs/qa/shots/legal-hero-{terms,privacy-policy}-1280.png` + 375; fix obvious visual regressions (scale/spacing) before committing.
- [ ] **Step 4: Docs** — PROGRESS entry; Design-handoff "Legal heroes adopt ServicesHero treatment" section (hunk-stage; never the Mobile-Tilt hunk); mapping.md `legal-page.ts` line updated (`.legal-hero*` removed except `__stamp`, note ServicesHero reuse + skipped pill row); qa/findings entry.
- [ ] **Step 5: Commit** — docs; message: `docs: legal heroes reuse ServicesHero — evidence, hooks, decisions`.
