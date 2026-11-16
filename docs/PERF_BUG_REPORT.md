# Decbricks — Performance & Bug Audit (Phase 1: measure & diagnose)

**Date:** 2026-11-16 · **Branch:** `perf/bugfix-optimise` · **Baseline tag:** `pre-perf` @ `e4f8986` (clean tree)
**Build:** `npm run build` ✅ 6 pages · `npm run check` 0 err / 0 warn / 1 hint · headings / links / check:brand / check:placeholders PASS · `check:footer` FAIL ×4 (see LOGIC-01)
**Phase 1 modified no source files.** Everything below is measured or read-only evidence.

---

## A. Scope & method

| Item | Value |
|---|---|
| Routes | `/`, `/services`, `/about`, `/contact`, `/terms`, `/404` (404 fetched as URL → HTTP 404) |
| Lighthouse | v12, mobile (`--form-factor=mobile --screenEmulation.mobile`), simulated slow-4G + 4× CPU (LH defaults = brief's throttling spec), 3 passes per route, **median** reported |
| Server | `astro preview` (production `dist/`) on **localhost:4322** |
| Runtime probes | Playwright (chromium `/usr/bin/google-chrome`, SwiftShader) — visual sweep 6 routes × 13 viewports, screenshots 5 widths, listener/heap walk 13 hops, event-timing INP sample, CLS-source attribution |
| Traces | `home-p1` + `terms-p1` saved via `--save-assets` → `/tmp/opencode/lh-assets/` (kept out of the repo; large) |
| Scope boundaries (other jobs — **not** redone here) | image conversion (done, `a613021`), dead-code cleanup (done), console-noise removal (done), HTTP cache headers (**found NOT landed — `dist/_headers` is empty** → report-only, E-3) |
| Validity note | First battery accidentally measured a stray `astro dev` server on :4321 (not this session's); results quarantined to `/tmp/opencode/invalid-lh-dev-4321/` and discarded. All numbers below are from the valid battery against the production preview. |

**Environmental notes.** A stray `astro dev` server (PID 214860, started 03:58, not owned by this session) is still listening on port 4321 and was left running. Lighthouse desktop runs on this box are unreliable (SwiftShader GPU artifact seen in prior sessions) — all scores are mobile, which is also the brief's primary target. Raw artifacts: `docs/qa/perf-before/*.json` (battery + probes), `docs/screenshots/perf-before/` (baseline stills for Phase-2 pixel-diff).

---

## B. Lighthouse medians (3 passes, mobile) vs budgets

| Route | Perf | A11y | BP | SEO | FCP (≤1.2s) | LCP (≤1.8s) | TBT (≤100ms) | CLS (=0) | SI | TTI |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | **92** ❌ | 96 ✅ | 100 ✅ | 69 ❌* | 1.96 ❌ | 2.96 ❌ | **125** ❌ | 0 ✅ | 2.31 | 4.54 |
| `/services` | **61** ❌ | 96 ✅ | 100 ✅ | 69 ❌* | 1.95 ❌ | **5.33** ❌ | 50 ✅ | **0.371** ❌ | 2.17 | 5.50 |
| `/about` | **84** ❌ | 96 ✅ | 100 ✅ | 69 ❌* | 1.96 ❌ | 4.26 ❌ | 55 ✅ | 0 ✅ | 2.13 | 4.48 |
| `/contact` | **94** ❌ | 96 ✅ | 100 ✅ | 69 ❌* | 1.80 ❌ | 2.93 ❌ | 42 ✅ | 0 ✅ | 2.01 | 4.24 |
| `/terms` | **95** ✅ | 100 ✅ | 100 ✅ | 66 ❌* | 1.95 ❌ | 2.63 ❌ | 18 ✅ | 0 ✅ | 2.16 | 4.03 |
| `/404` | 96 ✅ | 100 ✅ | 100 ✅ | 66 ❌* | 1.80 ❌ | 2.63 ❌ | 0 ✅ | 0 ✅ | 1.80 | 2.64 |
| **Budget** | ≥95 | ≥95 | 100 | 100 | ≤1.2 | ≤1.8 | ≤100 | 0 (≤0.02) | — | — |

\* SEO 69/66 is the **intentional pre-launch `noindex, nofollow` guard** (BUG-014, `Base.astro`; `robots.txt` = `Disallow: /`). Launch-state (`PUBLIC_ENV=production`) run: **⟨pending — section B.2⟩**

### B.1 Transfer profile per first load (median pass)

| Resource | Home | Services | About | Contact | Terms | 404 | Budget |
|---|---|---|---|---|---|---|---|
| JS (gz) | 119 KB | 119 KB | 119 KB | 119 KB | 118 KB | 119 KB | **50 KB content / 90 KB home** ❌ |
| CSS (gz) | 38.2 KB | 38.2 KB | 38.2 KB | 38.2 KB | 38.2 KB | 38.2 KB | ≤40 KB ✅ (barely) |
| Fonts | 105 KB (4) | 105 KB | 105 KB | 105 KB | 105 KB | 105 KB | — |
| Images | 2,563 KB (37) | 2,563 KB (37) | 2,563 KB (37) | 2,563 KB (37) | 2,563 KB (37) | 2,563 KB (37) | — |
| Media | **11,008 KB** | 0 | 0 | 0 | 0 | 0 | — |
| HTML doc | 19 KB | 19 KB | 16 KB | 12 KB | 12 KB | 4 KB | — |
| Warmed HTML fetches (cross-route) | 3 / 47 KB | 3 / 47 KB | 3 / 49 KB | 3 / 54 KB | 4 / 66 KB | 4 / 66 KB | — |

The **37 images / ~2.4 MB on every route — including `/404`** — is the route-warming feature (PERF-03). The **11 MB Media on home** is the showreel hero preview (PERF-04). JS attribution: `bootup-time` puts **2,193 ms of script evaluation** on the single app chunk at home (1,319–1,359 ms on content routes, 526 ms on 404); the chunk is one 327 KB leaf in `script-treemap-data` (no source maps → no per-module split, attribution via import graph in D-2).

### B.2 Launch-state SEO run (BUG-014 flip)

`PUBLIC_ENV=production` rebuild verified the documented flip: `dist/robots.txt` → `Allow: /` + sitemap line, home → `index, follow…`, `/terms` keeps its **intentional** `noindex, nofollow` (draft legal page). Lighthouse (same throttling, labelled runs):

| Route (launch state) | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` ×2 | 93 / 91 | 96 | 100 | **100** ✅ | 2.78 / 2.99 s | 0.004 |
| `/services` | 61 | 96 | 100 | **100** ✅ | 5.33 s | 0.371 |
| `/terms` | 95 | 100 | 100 | 66 ✅ (intentional noindex) | 2.63 s | 0.004 |

**SEO 100 is achieved on all indexable routes in launch state; `/terms` + `/404` remain noindex by owner decision (draft page), so their 66 is correct behaviour, not a defect.** Home shows a small 0.004 CLS in this state (still ≤0.02 budget). Perf/A11y are unchanged vs baseline — SEO was the only flip-affected category.

### B.3 Runtime probe results (Playwright, production preview)

- **Visual sweep** — 6 routes × 13 viewports (360→2560 px, incl. landscape phone): **0 horizontal scroll, 0 broken images, 0 page errors** (`visual-sweep.json`). Single flagged entry: WebGL `GPU stall due to ReadPixels` warnings (home @1024) — SwiftShader software-GL artifact of the lab, not a site bug. Nav highlight (`aria-current`), body classes and per-route state all correct after swap.
- **Memory / leak walk** — 13 navigations (/, /services, /about, /contact, /terms, /404, repeats; client-side swaps + reload mix): **no leak** — JS heap flat 6–11 MB across hops with forced GC; ScrollTrigger counts per-route (43/23/23/13/3) and always torn down on swap; WebGL canvases correct size (1280×800 ×2) after every swap (BUG-015 fix holding) (`memory-nav.json`). Minor signal (**LEAK-01, P3**): persistent-surface listener registrations grow ~20–50 per client-side navigation on `window`/`document` with no matching removals (e.g. window 82→207 across 4 swaps, then resets to 75 on reload). Detached-node listeners collect fine (heap flat), so impact is negligible today — worth a teardown audit pass in B3, not urgent.
- **INP proxy (lab, unthrottled)** — max event-timing duration across all routes: **16–32 ms** (budget ≤100 ms) (`interaction.json`).
- **Tap targets (systemic)** — controls under 24 px on **every** route/viewport (WCAG 2.5.8): video progress + volume range inputs ≈**10 px**, consent ToS/Privacy links 13 px, video Play/Mute 24 px, mobile menu links + footer socials 30 px, service jump pills 40 px, Submit 34 px, cookie Accept All 34 px → **A11Y-05, P2**.
- **Video behaviour** — hero preview **pauses when scrolled out of view** ✅; showreel player start could not be exercised headless (autoplay/CDP limitation) — off-screen pause for the player itself unverified in lab, code review shows no pause hook (`video-player.ts`) → noted as evidence limitation for PERF-04 verification.
- **Fonts** — all four families confirmed loaded on every route (kickers render Departure Mono, headings Power Grotesk, display FK Raster); text-utility font architecture is intentional (unclassed `<p>` inherits the html default stack by design of the template).

---

## C. Bug register

Severity: **P1** = violates the brief's hard targets or WCAG · **P2** = real defect, smaller impact · **P3** = hygiene. "Batch" = proposed Phase-2 fix batch (Section E). Root causes for all P1s are pinned to file/line in Section D.

| ID | Sev | Area | Summary | Root cause (one line) | Batch |
|---|---|---|---|---|---|
| PERF-01 | P1 | Perf | Every route ships one 335 KB min / **119.5 KB gz app chunk** (~2.4× budget) | `main.ts` statically imports every feature module; Vite fuses the graph into one chunk misnamed `LegalPage…` | **B3** |
| PERF-02 | P1 | Perf | First-visit **loader gate**: LCP 2.6–5.3 s, FCP ~1.95 s vs 1.8/1.2 budgets | Loader intro owner-set to ~3.0 s (2026-11-14) + 3.4 s asset-wait cap inside the gate; fresh profiles always pay it | **B4 (owner)** |
| PERF-03 | P1 | Perf | **Route warming** pulls 37 images / ~2.4 MB + 3–4 HTML fetches on **every** route (even `/404`), inside the loader window | `warmAllRoutes()` in the loader `waitForAssets` gate (`main.ts:147-153`); runtime-confirmed — home client logos fetched during a `/services` visit (`cls-sources-throttled.json`) | **B4 (owner)** |
| PERF-04 | P1 | Perf | Showreel hero preview transfers **11 MB** during home load | `decbricks-showreel.mp4` = 14.3 MB / 3.71 Mbps / 30.8 s, used as autoplay preview on every breakpoint — **owner decision** (`Media(preview-full-showreel)`, removed the 1.6 MB preview; bitrate bump `f4a6005`) | **B5 (owner)** |
| PERF-05 | P1 | Perf | `/services` LCP **5.33 s** — LCP text paints ~2.3 s after loader reveal | Entrance choreography holds the hero display text invisible (SplitText `from` tweens) + 1.3 s chunk eval | **B4 (owner)** |
| CLS-01 | P1 | CLS | `/services` **CLS 0.371** — `div.parts-servicesHeroNavRow` (412×281 px "JUMP TO" block) shifts, deterministic 3/3 passes | FK Raster (giant display font) has **no metric-matched fallback face** → late cold-load arrival reflows display text and pushes the row; duplicate hover-label slivers (`parts-serviceNavLink__label.absolute`) collapse as shift sources | **B4** |
| A11Y-01 | P1 | A11y | `aria-allowed-role` fail on every route | `role="presentation"` + non-empty `alt` on decorative `computer-back/front` imgs (`ContactForm.astro:238,259`) | **B1** |
| A11Y-02 | P1 | A11y | Consent links 3.68:1 at 10px (fg ≈#9860ff) | Template-legacy rule `.parts-formCheckbox .parts-formCheckbox__label a { color: oklch(63.01% .225 295.41) }` (≈violet) | **B2 (owner, colour)** |
| A11Y-03 | P1 | A11y | `label-content-name-mismatch`: 5× "FIND OUT MORE" service-card buttons (home) + "BACK TO HOME" (404) | Duplicate hover-label spans aren't `aria-hidden`, so textContent ⊄ accessible name | **B1** |
| A11Y-04 | P2 | A11y | Active "JUMP TO" pill = white on coral `#D45060` ≈3.9:1 @12px (LH didn't flag; manual) | `aria-[current=true]:bg-purple` → `--color-purple:#D45060`; owner-approved olive treatment exists for active accents (tokens §2c) | **B2 (owner)** |
| LOGIC-01 | P2 | Logic | Footer email is inert `<p>`; `footer.ts` copy/copy-status hooks (`[data-copy-email]`, `[data-copy-status]`) exist **nowhere** in markup; `check:footer` FAIL ×4 | `FooterContact.astro` renders email as plain `<p>` — mailto + Copy button contract dead; JSON-LD/CalEmbed still advertise the address | **B2** |
| PERF-06 | P2 | Perf | Home TBT 125 ms (>100 budget) | LegalPage-chunk long tasks 207 ms + 140 ms @~5.2–5.5 s (post-reveal init of testimonials/case-studies) | **B3** |
| PERF-07 | P2 | Perf | Departure Mono (22 KB) loaded on **every** route, not preloaded; `.u-kicker` = `var(--font-mono)` → kicker FOUT above the fold | Only non-preloaded brand font; kickers render in first viewport | **B4** |
| A11Y-05 | P2 | A11y | Tap targets under 24 px on every route: video progress/volume inputs ≈10 px, consent links 13 px, Play/Mute 24 px, menu links 30 px (WCAG 2.5.8) | Controls sized for looks, no min-size guard | **B1 (owner, size)** |
| LEAK-01 | P3 | Perf | `window`/`document` listener registrations grow ~20–50 per client-side navigation, never removed (heap unaffected: 6–11 MB flat over 13 hops) | Some module teardowns skip persistent-surface listeners (bus/window/document) | **B3** |
| HTML-01 | P3 | HTML | Home HTML 132.7 KB raw (19 KB gz) — 55.7 KB class attrs, 36.6 KB inline SVG ×58, 1,148 elements | Tailwind utility strings + repeated template SVGs (doubleSlash ×N) | — (context) |
| CSS-01 | P3 | CSS | Single shared 38.2 KB gz stylesheet (budget 40) carries legacy template utilities | Compiled Tailwind output from the 1minus1 template + `decbricks.css` overrides on top | — (watch) |
| ENV-01 | P3 | Infra | `astro preview` sends no `Accept-Ranges` on video; `dist/_headers` is **empty** (cache-headers job not landed) | Report-only (scope); matters for real deploys | — |
| DOC-01 | P3 | Docs | AGENTS.md typography section says Bricolage Grotesque; shipped fonts are **Power Grotesk / Hanken / FK Raster / Departure Mono** (owner commits `3e6d0b2`, `f4a6005`) | Doc drift, not a code bug | — |

**Report-only, pre-existing (owner decisions, untouched here):** BUG-014 launch-day noindex flip (quantified in B.2); `noindex` guard intentionally keeping SEO at 69/66; `document.execCommand` deprecation hint (`footer.ts:22` — moot if LOGIC-01 is rebuilt per the original contract).

---

## D. Root-cause annex

### D-1 · First-visit loader gate (PERF-02, PERF-05, PERF-07 context)
`Base.astro:79-85` adds `loader-skip` pre-paint **only when `sessionStorage['decbricks:loader-seen']==='1'`** (same-session repeat visits). Every fresh profile (and every real first visit) plays the intro: `loader.ts:11-13` → `INTRO_TARGET_S = 3.0`, `ASSET_WAIT_CAP_MS = 3400`, `HARD_CAP_MS = 3800`. `main.ts:147-153` wires `waitForAssets = Promise.allSettled([preloadCurrentPageImages(3.4s cap), warmAllRoutes()])` **inside the gate**. LCP is **hero text on every route** (home: `span.sections-hero__headingInner` "BEYOND"; services/about/contact: services-hero display `<p>`; 404: `<h1>`) — so the LCP floor is loader reveal + entrance choreography, not media.

### D-2 · Bundle shape (PERF-01, PERF-06)
- `dist/_astro/LegalPage.astro_astro_type_script_index_0_lang.BUT5Y6D_.js` — 335 KB min / **119.5 KB gz** — is the **entire app**: `src/pages/*.astro` each carry `<script>import '../scripts/main'</script>` (70-byte per-page stubs re-export it), and `main.ts:1-31` statically imports gsap core + all 6 plugins (`core/gsap.ts:9` registers ScrollTrigger, SplitText, CustomEase, Flip, Draggable, InertiaPlugin), Lenis, loader, hero, case-studies (736 L), testimonials, services-page (630 L), keywords, smiley-text (419 L), video-player, page-transition (691 L), menu, buttons, cookies, contact, cal-embed, cal-modal, footer, webgl facade.
- The chunk **name** comes from `src/components/LegalPage.astro`'s script colliding first; terms/404/contact therefore also ship hero/case-studies/testimonials code they never run.
- `impl.DtNrT8wu.js` (three.js, 557 KB min / **140 KB gz**) is correctly behind `initWebGL()`'s `innerWidth < bp.lg` check **before** the dynamic import (`webgl/experience.ts:73`) → **mobile never downloads it**; desktop loads it on every route (footer canvases exist on all routes). No `modulepreload` for it in HTML (mpre=0).
- `page.BT_9kWGp.js` is Astro's prefetch client (2.25 KB min) — hover strategy (`astro.config.mjs`, `prefetchAll:false`) ✅.

### D-3 · Route warming (PERF-03)
`page-transition.ts:59` `ROUTE_WARM_TARGETS = ['/','/about','/services','/contact']`; `fetchRouteHtml` + responsive-image warming (`image-preload-runtime.ts`): 37 images / 2,563 KB + 3–4 warmed HTML fetches observed on **every** route (404 included, where the page's own images are ~0). SaveData is respected (`page-transition.ts:81,95`). The warming runs inside the loader gate on first visit (D-1) and immediately via `requestIdleCallback` on repeat visits (`page-transition.ts:641-651`). **Documented owner feature** (open-items) → quantified for the owner's timing decision, not treated as a defect per se.

### D-4 · services CLS 0.371 (CLS-01)
All 3 LH passes: single shift, impact node `div.page > section.sections-servicesHero > div.relative > div.parts-servicesHeroNavRow` ("JUMP TO" nav, `grid-cols-2` on mobile, 412×281 px @ y≈412). Unthrottled local probe (warm cache): **CLS 0** — proves the shift is a cold-load artefact. **Throttled reproduction (CDP slow-4G + 4× CPU, cold, `probe-cls2.cjs` → `cls-sources-throttled.json`)**: navRow shifts [0,391]→[0,412] at t≈4.8 s with shift sources = the **duplicate hover-label spans** `span.parts-serviceNavLink__label.absolute.inset-x-0` collapsing (97×1 px slivers → 0×0), immediately after all four fonts complete at **t≈3.9 s**. Mechanism: the hero display text renders in `font-offBit` = **FK Raster Roman Compact**, which — unlike Power Grotesk / Hanken — has **no metric-matched fallback face**; when FK Raster arrives after the loader reveal, the giant display text reflows and pushes the JUMP-TO row (21 px here; LH's cold simulated network produces the full 0.371 impact). Secondary source: the hover-label slivers briefly occupying layout before the button-char-slide machinery hides them. Phase-2 fix direction (B4): (a) declare an `"FK Raster Fallback"` face with size-adjust/ascent overrides mirroring the Power/Hanken pattern, and/or (b) `visibility:hidden` the duplicate label spans until hover (also removes A11Y-03's doubled textContent), and/or (c) preload decision ND-6 for Departure Mono (`.u-kicker` above the fold).

### D-5 · A11y fails (A11Y-01..04)
- **A11Y-01**: `ContactForm.astro:222-239,258-259` — `<img alt="computer-back" … role="presentation">` (and computer-front). `alt` + `presentation` is contradictory; aXe fails `aria-allowed-role`. Fix: `alt=""` + drop the role (decorative 3D silhouettes). Zero visual change.
- **A11Y-02**: Lighthouse: "insufficient color contrast of 3.68 (foreground #9860ff, background #fff9f2, 7.5pt normal)". `#9860ff` appears **nowhere** in source — the culprit is the template rule `.parts-formCheckbox .parts-formCheckbox__label a { color: oklch(63.01% .225 295.41) }` (Chrome resolves/axes-reports it ≈ #9860ff violet). The links inherit the label's `text-darkPurple` (which passes) only if this scoped rule is removed. Fix: point that rule (or an override in `decbricks.css`) at `var(--color-ink)` / `--color-darkPurple`. Colour change → owner sign-off (B2).
- **A11Y-03**: service-card CTA `aria-label="Find Out More about Strategy & Consulting"` + visible text `FIND OUT MORE\nFIND OUT MORE` (duplicated hover-label span, not `aria-hidden`) → accessible name doesn't contain the full textContent. Same on 404 `part-btnPrimary` "BACK TO HOME". Fix: `aria-hidden="true"` on the duplicate span (the template already does this pattern elsewhere). Zero visual change.
- **A11Y-04** (manual, not LH-flagged): hero JUMP-TO active pill `aria-[current=true]:bg-purple` → coral bg + white 12px text ≈3.9:1. Owner already approved olive `#5A6432` for active accents (tokens §2c, BUG-005/006 precedent).
- **A11Y-05** (manual sweep, `visual-sweep.json`): interactive controls below the 24 px WCAG 2.5.8 minimum on every route — worst are the video progress/volume `<input type=range>` (≈10 px), consent ToS/Privacy links (13 px), Play/Mute (24 px), mobile menu links (30 px). Fix = min-height/padding on the affected controls; subtle visual size increase → owner sign-off (ND-8).

### D-6 · Footer email (LOGIC-01)
`FooterContact.astro` renders `{email && <li><p class="structure-footer__link">{email}</p>…}` — an inert `<p>`. `footer.ts:60-62,152-153` queries `[data-copy-email]` / `[data-copy-status]` (click → clipboard → status toast) which exist in no component (grep: 0 hits). `npm run check:footer` FAILs on 4 pages: JSON-LD `Organization.email = "hello@decbricks.com"` ≠ footer mailto (absent). CalEmbed.astro's fallback card uses `mailto:` — so the address is real; only the footer wiring is missing.

### D-7 · Fonts & text rendering
Power Grotesk (variable 400–800) + Hanken (100–900) + FK Raster (400) preloaded ✅; Departure Mono **not preloaded** but loaded on every route (kickers via `.u-kicker` → `var(--font-mono)`) → 105 KB font total/route. `html.loader-skip .structure-loader` hides the overlay for same-session repeats (`decbricks.css:323`) — lab runs are always first-visit, so lab LCP includes the intro (owner decision ND-1).

---

## E. Phase-2 batched fix plan (proposed)

**Commit discipline:** one commit per batch · RED→GREEN regression probes for every Critical/High bug (listed per batch) · pixel-diff vs `docs/screenshots/perf-before/` at 1440 + 390 after each visual-touching batch (reuse `scripts/visual-diff.py`) · full Lighthouse re-run + probes at the end · rollback point `pre-perf` · PROGRESS.md line per batch.

| Batch | Contents | Bugs closed | Regression probe (RED→GREEN) | Visual risk |
|---|---|---|---|---|
| **B1 — A11y markup (zero-visual + sized controls)** | `alt=""` + drop `role="presentation"` on the 2 decorative imgs; `aria-hidden="true"` on duplicate button-label spans (service cards + 404 CTA); tap-target min-size on video inputs / consent links / menu links (ND-8) | A11Y-01, A11Y-03, A11Y-05 | Re-run LH a11y on home+404 (aria-allowed-role / label-content fail→pass); tap-target sweep re-run | none, except A11Y-05 (slight control growth) |
| **B2 — Brand/colour + footer email (visual, owner-approved items)** | Consent-link colour → brand ink; active pill coral→olive (approved precedent); rebuild footer email as mailto + Copy button per `footer.ts` contract (`data-copy-email`/`data-copy-status` hooks); `check:footer` → green | A11Y-02, A11Y-04, LOGIC-01 | `npm run check:footer` (RED now, GREEN after); computed-colour probe on the 2 links (3.68→≥4.5); contrast probe on active pill | small (link colour, pill bg, footer email row) |
| **B3 — JS architecture (zero-visual)** | Route-aware lazy feature loading in `main.ts` (per-route dynamic imports keyed off existing route registry) + `manualChunks` vendor split (gsap/lenis); keep boot+teardown contract (Hard rule 2); expect big drop toward 50 KB content / 90 KB home budget; also removes home's 207/140 ms post-reveal long tasks | PERF-01, PERF-06 | Bundle-size probe (assert gz < budget per route); boot-time listener/teardown walk must stay clean; LH Perf/TBT re-run | none (behaviour identical) |
| **B4 — Loading & CLS (owner decisions inside)** | Implement agreed ND-1..3 + CLS-01 root-cause fix + Departure Mono preload decision (ND-6); ensure services LCP text paints at reveal (ND-5) | PERF-02, PERF-03 (timing), PERF-05, CLS-01, PERF-07 | CLS probe on /services (0.371→<0.02); LH LCP medians re-run; trace re-capture home | motion timing only |
| **B5 — Media (owner decision)** | Showreel preview variant (shorter/bitrate-capped) per ND-4; poster-first if agreed | PERF-04 | Network probe: media KB on home (11,008→target) | video quality (owner-owned) |

**Final verification gate (Phase 2 exit):** all 6 routes ×3 mobile LH medians ≥ targets (Perf ≥95 stretch 100, A11y ≥95, BP 100, SEO 100 — SEO only achievable in launch state), CLS ≤0.02 everywhere, LCP ≤1.8 s, TBT ≤100 ms, FCP ≤1.2 s; budgets: JS ≤50 KB gz content / ≤90 KB home, CSS ≤40 KB gz; `npm run build` + `npm run check` + all house gates green; pixel-diff clean at 1440/390; heap walk flat over 10 navigations.

### Needs decision (owner) — nothing in Phase 2 blocks on these except B2/B4/B5 colour-motion items
- **ND-1 · Loader intro duration** — owner-set 3.0 s (2026-11-14 revert) costs ~1.0–2.4 s LCP in lab (FCP→LCP gate) and blows FCP/LCP budgets on every route. Options: (a) keep 3.0 s (accept LCP budget miss), (b) compress to ~1.1 s (Phase 2.4 behaviour), (c) 3.0 s on desktop, ≤1.1 s on mobile, (d) skip intro when `navigator.connection` slow. **Recommend (b) or (c).**
- **ND-2 · Route-warming timing** — currently inside the loader gate (first visit): 2.4 MB images + HTML compete with hero media. Options: (a) defer to post-load idle (loader waits only on *current-page* images), (b) keep as-is. **Recommend (a); SaveData guard already exists.**
- **ND-3 · Showreel preview** — 14.3 MB / 3.71 Mbps / 30.8 s file doubles as autoplay hero preview (11 MB on first home load). Options: (a) separate ~6–8 s preview cut @≤1.5 Mbps (≈1 MB), (b) keep full file. **Recommend (a).**
- **ND-4 · Consent links + active pill colour** — violet oklch → brand ink/burgundy; active pill coral → olive (both visible changes; olive precedent approved 2026-11-12).
- **ND-5 · Services LCP choreography** — paint the hero display text at reveal, animate after (LCP 5.33→~3.0 even with loader kept). Motion timing is owner-owned.
- **ND-6 · Departure Mono** — preload the 22 KB woff2 (kills kicker FOUT + likely CLS-01 contributor) vs accept swap.
- **ND-7 · Footer email feature rebuild** — restores documented mailto + Copy affordance (visual addition; LOGIC-01 also unblocks `check:footer`).
- **ND-8 · Tap-target sizing** — min 24 px (AA) or 44 px (comfortable) on video inputs/links/menu links; slight visual growth of those controls.

### Open questions / observations (no action required)
- Lighthouse did not flag the coral active pill or several `alt`/contrast items it sampled — manual sweep covers them; LH color-contrast also mis-reports `color-mix`/`oklch` fg hexes (the "#9860ff" is the oklch violet rule).
- `script-treemap-data` has no per-module leaves (no source maps in prod) — B3 attribution done from the import graph instead.
- `terms` is the trace capture proxy for "heaviest content page" (per brief); its Perf 95 shows the ceiling without warming media.

**Status line:** Phase 1 complete — battery (6×3, valid, port 4322), launch-state SEO runs, visual sweep (78 viewports), screenshots (60), memory walk (13 hops), INP sample, CLS root-cause reproduction, traces (24 MB, `/tmp/opencode/lh-assets/`, not committed). All findings above carry file/line or artifact evidence. Artifacts: `docs/qa/perf-before/` (JSONs), `docs/screenshots/perf-before/` (60 PNGs), `docs/qa/perf-probes/` (8 repeatable scripts).
