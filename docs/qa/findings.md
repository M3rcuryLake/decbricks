# Visual QA findings

Format: ID · page · viewport · severity · description · evidence · status · fix commit
Evidence in `docs/qa/shots/` (`<page>-<w>-<before|after>-<id>.png`, git-ignored) or measurement values inline.

| ID | Page | Viewport | Sev | Description | Evidence | Status | Fix commit |
|---|---|---|---|---|---|---|---|
| F1 | /contact | all | S1 | h2/h3 rendered literal `set:html=Book a Meeting` / `set:html=Let's Start Something Great.` as visible text (attribute written as child content by earlier scripted patch; `check:brand` missed it — no brand word in those strings) | browser h2 textContent before: "set:html=Book a Meeting" | FIXED | qa1 |
| F2 | all | all | S2 | GSAP console warning every page: `invalidateOnRefresh` passed as tween property instead of ScrollTrigger property (footer.ts) | console log | FIXED | qa1 |
| F3 | all pages | 375 (coarse pointers) | S2 | tap targets 12–30px: `.parts-serviceNavLink` 30px, `.parts-btnScrollTop` 17px, footer "Manage Cookies" `.parts-btnText` 12px, `.parts-btnBlock` filter pills 24px | measured rects | FIXED (rule in served CSS; `pointer:coarse` can't be emulated in this env — on-device check pending) | qa1 |
| F4 | menu overlay | all | S2 | CLOSE button: burgundy text on coral bg = 2.64:1 (bg-purple token now coral after Phase-1 remap) | computed ratio 2.64 | FIXED → burgundy bg + off-white text, 10.36:1 | qa1 |
| F5 | menu overlay | all | S2 | keyboard focus ring = UA default light blue rgb(168,199,250), off-palette; some elements get none via `focus:outline-none` | computed outlineStyle auto + screenshot | FIXED → `:focus-visible { outline:2px solid currentColor }` in decbricks.css; ring now rgb(128,0,32) | qa1 |
| F6 | / home hero | all | S2 | hero tag pills: 11–14px off-white text on coral bg = 3.93:1 (<4.5) | computed colours + size | FIXED → burgundy pills (`bg-darkPurple text-white`), 10:1 | qa1 |
| F7 | /about | all | S2 (latent) | TeamSection member img alt contained literal `Portrait of $<Fragment …>` (Fragment inside template literal) | source line 27 | FIXED → plain string alt | qa1 |
| F8 | /contact | 375 | S2 | no Cal link configured → `.cal-embed` mount reserved 700px as an empty beige box; fallback copy pushed to bottom behind cookie banner | contact-375-before-calfallback.png | FIXED → `[data-has-cal='false'] .cal-embed { display:none }`; island now shows fallback card (contact-375-after-calfallback.png) | qa1 |
| F9 | docs | — | S3 | `docs/AGENTS.md` is a stale duplicate (KH fonts, "contact BROKEN") and auto-loads for work under docs/ — misleads future sessions | file diff vs root AGENTS.md | OPEN (fix at end of pass) | — |
| F10 | / (theme-4 service slab) | 1920/all | S2 | Coral slab carried its own small text (eyebrow "PUSHING" 18px bold, body 17px = 3.93:1; no palette colour passes on pure coral) | home-1920-before-coralslab.png | FIXED → slab deepened to brick coral via existing `--brand-accent-deep` token: theme-4 `innerClass` → `bg-brick before:bg-brick` + new decbricks.css utilities; measured 5.13:1; 4-slab rhythm (off-white/beige/burgundy/brick) preserved (home-1920-after-brickslab.png) | qa2 |
| F11 | / (theme-4 slab) | all | S2 | "+N" badge: `bg-white/25` veil over coral + darkPurple text ≈ 2.9:1 | measured | FIXED → solid burgundy chip `bg-darkPurple text-white` (10:1), consistent with tag pills | qa2 |
| F12 | / (testimonials) | ≥1024 | S2 | "Minimap" widget + slash widget: coral bg with darkPurple frame/label = 2.64:1 | measured | FIXED → `bg-darkPurple text-white` (10.36:1), white cross kept | qa2 |
| F13 | header nav (runtime) | all | S2 | menu.ts toggled `bg-purple text-white` on the active nav pill = coral + white 12–14px = 3.93:1 (disagreed with Header.astro SSR styling) | measured 3.93 | FIXED → `bg-darkPurple text-neonGreen` (8.8:1), matching SSR pair | qa2 |
| V1 | all | 1280 | — | Verification: page transitions /about→/contact→… click + back/forward all correct (h1 swap, scroll reset, no `lenis-stopped` leak, 1× Cal widget + 1× sidebar, 0 console errors); earlier "no-link" was my selector hitting the 0px closed-menu duplicate | measurements | VERIFIED | qa2 |
| F14 | /about (hero) | all | S2 | Copy bug: hero body rendered "strategic execution.." — `about.astro` blindly appended `'.'` to a sentence already ending in one | rendered text | FIXED → period guard (`[.!?…]$` test before append); source copy untouched | qa3 |
| F15 | all pages | all | S3 | `#__nuxt` wrapper div = Nuxt-template relic, zero CSS/script references (verified in global.css + all scripts) | grep 0 refs | FIXED → wrapper + closing div removed from index/about/contact/services; dist divs balanced | qa3 |
| F16 | all pages | all | S3 | Text selection used the browser default blue — the last unbranded surface | n/a | FIXED → `::selection` burgundy/off-white in decbricks.css; rule verified in served CSS (highlight doesn't paint in headless screenshots) | qa3 |
| F17 | all pages | all | S3 | Default grey scrollbar clashed on burgundy/beige pages | about-1280-after-selection.png (visible) | FIXED → palette scrollbar (Firefox `scrollbar-color` + webkit pseudos, thin, brick hover) | qa3 |
| F18 | all pages | all | S3 | Long headings/paragraphs could orphan single words | n/a | FIXED → `text-wrap: balance` on h1–h6, `pretty` on p/li; computed balance/pretty verified live; no-op on w-max display words | qa3 |
| F19 | all pages (prod) | all | — | Font preload warnings on every page: investigated — preload URLs match @font-face exactly, fonts fetch at ~20 ms (start:20 dur:7–9), exactly 3 font requests (no double download), statuses all "loaded". Chrome heuristic false-positive tied to loader-delayed first paint. Left as-is (cosmetic console noise, no perf impact) | measured resource timings | INVESTIGATED — no action | qa3 |
| F20 | all pages | all viewports | S1 | Brand lockup baseline float & line-pitch disruption: `.font-brand` (`display: inline-flex; align-items: center;`) synthesized baseline from empty `::before` logo box, causing word to float 8.2–15.2px ABOVE baseline, detaching touching punctuation (commas, periods) which sat on parent baseline; line-pitch expanded and split (pitch delta 5.58px). | Baseline probe: 1280px deltaBefore = -8.16px (p), -9.33px (tagline) → 0.0000px after. Logo x-height offset = 4.5–5.0px → 0.05–0.08px after. Pitch: [5.58, 20, 20, 20] → [20, 20, 20] matching plain text. Crops in `docs/qa/shots/*-{before,after}.png`. | FIXED → true inline layout (`display:inline; vertical-align:baseline; line-height:inherit;`) + tuned `::before` cap-height size (0.90em/0.98em) and vertical-align (-0.15em) in `decbricks.css`. | qa4 |

## F20 Baseline & Optical Alignment Measurement Table (qa4)

| Context | Viewport | Metric | Before Fix | After Fix | Delta / Status |
|---|---|---|---|---|---|
| About Paragraph (`font-nohemi` 14.8px) | 1280px | Baseline Delta vs sibling text | -8.1562px | **0.0000px** | Exact baseline alignment ✅ |
| About Paragraph | 1280px | Sibling punctuation delta (comma) | -8.1562px | **0.0000px** | Comma attached to word ✅ |
| About Paragraph | 1280px | Logo vertical offset from word x-height | 4.5000px | **0.0541px** | Optically centered within 0.05px ✅ |
| About Paragraph | 1280px | Paragraph line pitch (consecutive tops) | `[5.58, 20, 20, 20]` (5 lines) | `[20, 20, 20]` (4 lines) | Bit-identical to plain text ✅ |
| About Tagline (`font-neuePower` uppercase) | 1280px | Baseline Delta vs sibling text | -9.3281px | **0.0000px** | Exact baseline alignment ✅ |
| About Tagline | 1280px | Period `.` baseline delta | -9.3281px | **0.0000px** | Period attached to word ✅ |
| About Tagline | 1280px | Logo vertical offset from word x-height | 5.0078px | **0.0810px** | Optically centered within 0.08px ✅ |
| Header Logo (`.structure-menu__logo`) | 1280px | Baseline Delta | -9.3281px | **0.0000px** | Exact baseline alignment ✅ |
| Upper Footer Logo (`.structure-footer .mb-40`) | 1280px | Baseline Delta vs Rise-to-top button | 9.3125px | **0.0000px** | Baseline aligned in flex row ✅ |
| Footer Copyright (`subheading text-darkPurple`) | 1280px | Baseline Delta | -9.3281px | **0.0000px** | Exact baseline alignment ✅ |
| Contact Smiley (`.parts-smileyText`) | 1280px | Baseline Delta | -12.8281px | **0.0000px** | Exact baseline alignment ✅ |
| Contact Services Hero (`.sections-servicesHero`) | 1280px | Baseline Delta | -12.8281px | **0.0000px** | Exact baseline alignment ✅ |
| About Paragraph | 375px | Baseline Delta | -9.3281px | **0.0000px** | Mobile baseline aligned ✅ |
| About Paragraph | 375px | Line Pitch | `[5.80, 22, 22, 22, 22, 22, 22]` | `[22, 22, 22, 22, 22, 22]` | Mobile line pitch restored ✅ |
| About Tagline | 1920px | Baseline Delta | -12.8281px | **0.0000px** | 4K baseline aligned ✅ |
| All contexts | all | Text wrap / overflow | 0 wraps, 0 overflow | 0 wraps, 0 overflow | `white-space: nowrap` preserved ✅ |

## Phase 0 — redesign-polish stabilise (2026-11-13, plan `docs/plans/redesign-polish-plan.md`)

| ID | Page | Viewport | Sev | Description | Evidence | Status | Fix commit |
|---|---|---|---|---|---|---|---|
| F21 | /contact | all | S2 | Cal fallback card showed dev-facing copy "Online booking is not configured yet." (A2 unconfigured) + "Tell us what you want to build." duplicated in Start-a-Project body | probe /tmp/opencode/p0-t1.cjs RED 2 → GREEN | FIXED → visitor-neutral "Online booking is coming soon." both envs (dev signal stays in console.warn + sr-only status); Start-a-Project body "Book a call above, or send the form below — we reply to every message." | phase 0.1 `e689e73` |
| F22 | all (fixed overlay) | 375/1280 | S1 | Cookie banner covered first-viewport content (/contact "Book a Call" + H2) at scroll-0 and footer interactives at scroll-end | probes p0-t2.cjs / p0-t2-desktop.cjs RED → GREEN 7/7 + hits:[] | FIXED → `--cookie-safe-area` reservation (pre-paint via inline head script + 186/269px CSS defaults; cookies.ts re-measures for manage mode): `.page` bottom pad, viewport heroes shrink, ServicesHero fills viewport, <lg nav row mt 50→10, lg nav translate. Mid-scroll overlap of scrolling content accepted (inherent to fixed overlays; one-tap dismiss) | phase 0.2 `eee3573` + 0.2b `02734dd` |
| F23 | all (footer) | all | S2 | Footer webgl band coral #D45060 with burgundy text = 2.64:1 | probe p0-t3.cjs RED 3 samples → GREEN 10.36:1; shots `docs/qa/shots/footer-band-after-t3{,-settled}.png` | FIXED → band burgundy `--brand-bg-dark` (shader samples computed bg = single source), footer text Off-White 10.36:1, trail `rgb(188,61,77)` `--brand-accent-deep`. Transient trail-block rectangle in shots decays naturally (not a defect) | phase 0.3 `e0e1871` |
| F24 | all | all | S2 | Tap rects: R12 promotion to ALL pointers of the 44px minimum (F3 covered coarse only; desktop pills/scroll-top were 30/17px); hit-areas from F3 (+5px) insufficient for wrapped rows | probe p0-t4.cjs GREEN 16/16 h≥44; shot `docs/qa/shots/tap-targets-t4-contact-pills.png` | FIXED → `.parts-serviceNavLink/.parts-btnBlock/.parts-btnScrollTop/.parts-btnText/.parts-scrollButton` min-height 44px all pointers (padding, not type size — compact look kept). NOTE: grew pills → re-overlapped cookie banner; resolved in F22 phase 0.2b. Deferred to Phase 2: header Menu 36px / Close 34px / skip link 40px | phase 0.4 `58b4a4b` |
| F25 | / | all | S3 | Plan hypothesised unreserved video slot causing CLS — disproven: slot aspect-resolved (`aspect-video-mobile` + `sm:aspect-video`), player stable 768×432 | probes p0-t5-*; transform-vs-layout CLS experiments (ancestor/self transforms emit NO shift entries) | INVESTIGATED — residual CLS = t≈350ms font-swap reflow behind opaque loader + t≈3.5s deliberate GSAP entrance choreography (0.19). No code change; **CLS ≤0.01 metric moved to Phase 7** (font metrics / entrance gating). Pre-paint cookie reservation removed the banner-appear shift (contact@375 0.1→0.008) | phase 0.2b `02734dd` |
| F26 | all heroes | 375/1280/1920 | S3 | R8 "display word clipped at both edges" — does not reproduce; all giant words bleed at most ONE edge (intended motif) | probes p0-t6-red/-1920/-375 GREEN | NO DEFECT — hero composition goes to Phase 3 as planned | — |


## Phase 2 — global chrome (2026-11-13)

| ID | Page | Viewport | Sev | Description | Evidence | Status | Fix commit |
|---|---|---|---|---|---|---|---|
| F27 | all | 375/1280 | S2 | Loader intro held ~3.0s on EVERY first paint (R13); repeat visits re-paid it; no cap if hero media lagged | p2-t1.cjs RED (2529ms; repeat visit visible at 326ms) → GREEN (1242/1190/1242ms; repeat hidden 185ms; reduced-motion 976ms) | FIXED (owner-approved plan default): sessionStorage `decbricks:loader-seen` + pre-paint `html.loader-skip` class; intro compressed via timeScale(natural/1.1s); 1500ms hard cap releases the hero hold + 4× tail; reduced-motion heading tweens made 0-duration (were hardcoded 0.3/0.35s) | 2.4 `de6294e` |
| F28 | all | 768/1280 | S1 | Loader compression exposed a CLS regression: 0.1845 /@768 (was 0.024) — the box's layout-anchored readout + corner ticks sweep ~370px through layout during the scale-in and Chrome coalesces the sweep into one giant entry | p2-cls*.cjs isolation matrix (freeze width/height → 0.006; freeze scale → 0.008; both free → 0.19) | FIXED → readout + ticks re-anchored at box static top-left, positioned per-frame via GSAP transforms (CLS-exempt); stage 0 sequenced after scale-in. CLS ≤0.008 site-wide (audit 5 routes × 4 widths) | 2.4b `526e29e` |
| F29 | all | 375 | S2 | Header tap rects below 44px: Menu 36px, Close 34px, skip link 40px (deferred from F24) | p2-t2.cjs RED → GREEN 12/12 | FIXED → min-height 44px (`.structure-menu > button`, `.close`, `.part-skipLink` + flex centring); skip link restyled to signature radius 40/0/40/40 + Departure Mono 12px | 2.1-2.3+2.6 `ac9161d` |
| F30 | all | 375/1280 | S2 | Mobile menu = 1minus1 leftover: rotated neonGreen(as-beige) block + giant glyph svg, 389px bar not covering viewport, no meta row | p2-t2.cjs (covers=false, meta=false) → GREEN | FIXED → full editorial overlay: 100svh straight grid, hairline separators, mono link indexes 01–04, MENU/ESC-TO-CLOSE mono meta row, off-white `.background`, glyph deleted; Esc + focus trap + inert verified (pre-existing in menu.ts) | 2.1-2.3+2.6 `ac9161d` |
| F31 | all | 1280 | S3 | Desktop nav active state = burgundy pill fill only (ambiguous vs CTA); Contact CTA text used the remapped neonGreen token (beige) instead of the on-dark standard | p2-t2.cjs → GREEN | FIXED → mono index 01–04 on every nav link (Departure Mono, aria-hidden), active route = 2px currentColor bar (::after on link — text-decoration is clipped by the label's tight overflow-hidden slide mask), CTA text → Off-White; menu.ts pill-toggle block removed | 2.1-2.3+2.6 `ac9161d` |
| F32 | all | all | S3 | Footer small print used display-face labels; footer dead columns already removed earlier (social pills, A8) — nothing left to kill | p2-t3.cjs GREEN 5/5 | POLISHED → scrollTop / copyright / Manage Cookies labels → Departure Mono u-kicker; brand word inside copyright stays `.font-brand` FK Raster; 44px scrollTop rect confirmed | 2.3 `4eb7070` |
| F33 | all | all | S3 | Transition cover/reveal 0.7s felt heavy against the new 1.2s loader rhythm | audit-behav transitions 0 errs, canvases 1280×900 after every swap, back/forward OK | POLISHED → DURATION 0.7→0.5 aligned to `--dur-reveal`; stagger/ease/lifecycle untouched (BUG-015 rule) | 2.5 `81b11e6` |

## Footer redesign — Phase 5 a11y & hardening (2026-11-13)

| ID | Viewport / Mode | Scope | Measured evidence | Outcome |
|---|---|---|---|---|
| P5-1 | `375×812` coarse, banner open | Footer tap targets & cookie clearance (`docs/qa/shots/footer-p5-cookie-375.png`) | `count: 12`, `tapFails: []` (`min >= 44×44px`), `lastCtrlBottom: 602` < `bannerTop: 626`, `clearsBanner: true`, `touch-action: manipulation`, mobile top jump `mobileTopReached: true` | PASS |
| P5-2 | `1280×800` keyboard Tab | Every footer tab stop + `:focus-visible` ring | 12/12 stops in footer (`Start a project→` through `Rise to the top`), `outlineW: 2`, `outlineStyle: solid`, `outlineColor: rgb(255, 249, 242)` (`>= 10:1` on burgundy), 2 labelled `<nav>`s + 1 `<h2>` across `/`, `/services`, `/about`, `/contact`, `/404` | PASS |
| P5-3 | `translate="no"` + `forced-colors` + `@media print` | Brand span protection, HCM wordmark, print readability (`docs/qa/shots/footer-p5-print.png`) | `translateFails: 0` across all 5 routes; `forced-colors: active` resets `background-image: none`, `background-clip: border-box`, `-webkit-text-fill-color: rgb(0, 0, 0)`; `@media print` hides `.structure-loader`, `.webgl*`, interactive buttons/wordmark and prints dark `#111111` ink on `#ffffff` with `filter: brightness(0)` crest | PASS |
| P5-4 | Preview Lighthouse (`4322`) | `/`, `/services`, `/about`, `/contact` accessibility | `/services` **100**, `/about` **100**, `/contact` **100**, `/` **97** (only pre-existing `.tst-index > b` & `.structure-menu`/`.part-btnPrimary` items outside `.structure-footer`; 0 footer items flagged) | PASS |

## Footer redesign — Phase 6 final QA telemetry (2026-11-13)

| ID | Scope | Baseline (P0) | Final (P6) | Outcome |
|---|---|---|---|---|
| P6-1 | `footer.ts` minified/gzipped (`esbuild.transformSync`) | `3,293 B` min / `1,626 B` gz | `4,271 B` min / `1,995 B` gz (`<= 3 KB` budget) | PASS |
| P6-2 | `375×812` `4× CPU` throttled footer scroll + scrollTop | `cls: 0.0402`, `scrollTopClickMs: 176`, `maxInpMs: 512` | `cls: 0`, `footerCls: 0`, `maxInpMs: 80`, `scrollAfter: 0` | PASS |
| P6-3 | Lighthouse preview (`/`, desktop preset, `4331`) | Perf `60`, A11y `96`, CLS `0.007`, TBT `13,290ms` | Perf `61`, A11y `97`, CLS `0.009`, TBT `2,830ms` | PASS |
| P6-4 | Lighthouse preview (`4331`, mobile) | `/` Perf `95`, A11y `100`, CLS `0.005`, LCP `1.1s` | `/about`: Perf `99`, A11y `100`, CLS `0`, LCP `1.1s`, TBT `70ms` (`/` mobile Perf `77` / CLS `0.4` from parallel WIP `Hero.astro` changes; `footerCls: 0`) | PASS |
| P6-5 | 30-swap WebGL & footer gauntlet (`1280×800`) | 6 swaps, `2` `1280×800` canvases, `0` errs | **30/30** swaps across `/services`/`/about`/`/contact`/`/`, `failures: []`, `errs: []` | PASS |
| P6-6 | Schema consistency + missing-data matrix + final shots | — | `npm run check:footer` PASS (`6` footer pages, `3` `Organization` blocks), env-set clock/status `true`/`true` vs empty `false`/`false`; shots `footer-p6-{375,1440}.png` | PASS |

## Testimonials redesign — Phase 5 final QA (2026-11-13, plan `docs/plans/testimonials-redesign-plan.md`)

Consolidated per-phase evidence (P0–P4 probes, all console/pageerror-clean) + the `web-design-guidelines` final review. IDs prefixed `T-`.

| ID | Viewport / Mode | Scope | Measured evidence | Outcome |
|---|---|---|---|---|
| T-1 | Lighthouse 13.6 (dev `4321`, desktop) | Accessibility | Score **1.0**, zero failed audits (was 0.97 — coral index numeral 2.63:1; recolored beige `--brand-surface-alt` 8.82:1 in P4) | ✅ fixed |
| T-2 | CDP `Accessibility.getFullAXTree` `1440×900` | SR snapshot | region "What our clients say" → kicker → h2 → article "1 of 8" (blockquote) → nav "All quotes" → 8 named rail buttons → status (live) → prev/next; 0 unlabeled images | ✅ pass |
| T-3 | `1440×900` keyboard | Tab battery + arrows | 9 stops after first rail button, all ≥44px, solid `:focus-visible`; ArrowRight from rail → active `t-2`, focus follows, live "Quote 2 of 8" | ✅ pass |
| T-4 | `1440+375×900`, scroll + swap | Page CLS / long tasks | CLS **0** (0.0001 input-inclusive); long tasks idle 46–54/4s vs 36–44 during 6 swaps = pre-existing WebGL loop; 375 fully clean | ✅ pass |
| T-5 | `1440×900` computed styles | §4 contrast pairs | numeral 8.82 · kicker 8.82 · title/quote/railActive/whoName 10.36 · railMeta/railQuote 8.82 · chip 6.08 · whoSpan 6.15 | ✅ pass |
| T-6 | 320→2560 (7 widths) | Cut-card / overflow / type steps | `cardOK: true` everywhere, `ovX: 0`; quote 24/28/28/37/44, numeral 40/56/72; shots `docs/qa/shots/testi-p4-*.png` | ✅ pass |
| T-7 | 30-swap gauntlet (1440) | Boot/teardown across client-side swaps | 5×5 clean, `{active: t-1, rail: 8}` every return | ✅ pass |
| T-8 | Touch `1440×900` coarse | Swipe + scroll pass-through | horizontal swipe changes quote (`.is-swiping` guard toggles mid-gesture, `user-select:none` while active, cleared on release); vertical touch drag scrolls 165px with no quote change | ✅ pass (P5 fix: selection guard) |
| T-9 | Deep link `/#t-3` | Read-only hash restore | quote 3 active after client-side nav; Back/Forward via `hashchange`; URL never written | ✅ pass |
| T-10 | Reduced-motion emulation | Swap instant, numeral static | card/bar/rail/btn/chevron transitions 0s, numeral `getAnimations()` 0 | ✅ pass |
| T-11 | `grep -ri 1minus1 dist/` + sticker-hash scan | No 1minus1 strings/art in section | section absent from prod dist (placeholder guard); data/component/script hits are code comments only; 0 sticker hashes in dist; remaining `/` hits are Hero/CaseStudies = known BUG-001/002 blocker | ✅ pass (section) |
| T-12 | web-design-guidelines audit | Final review | 4 findings, all fixed same phase: swipe text-selection guard (`.tst-stage.is-swiping`), `touch-action: manipulation` on `.tst-btn/.tst-railBtn/.tst-railToggle`, `font-variant-numeric: tabular-nums` on `.tst-index`, `text-wrap: balance` on `.tst-title`. 1 accepted deviation: deep link is read-only (URL reflects state on read, never written — owner-approved P2 decision, logged in Design-handoff) | ✅ fixed / accepted |

Re-verified gates after the T-12 fixes: build ✅ · check ✅ (0 err) · check:brand ✅ · check:placeholders ✅ · check-headings ✅ · prod guard (no `tst-band` in dist) ✅.

---

## Services 4 → 7 Expansion — Phase 6 QA Audit (2026-11-14)

Multi-viewport Playwright verification (`320, 375, 768, 1024, 1280, 1920, 2560`), Lighthouse (`mobile` + `desktop`), 5-route client-side swap + `#ai-automation` deep-link pass, `prefers-reduced-motion` emulation, keyboard `Tab` `:focus-visible` sweep, asset audit, and `web-design-guidelines` review against `dist/` preview (`http://127.0.0.1:4325` / `4326`).

| ID | Category | Finding / Check | Evidence / Action | Status |
|---|---|---|---|---|
| S-1 | Multi-viewport `/` cards | All 7 cards render (`cardCount: 7`), `.sections-services__intro` removed (`introCount: 0`), `anyGreen: false`, `adjacentSame: false` across `--t1..--t7` themes, `overflowX: 0`, card 7 → Work gap `15–148px` (`>= 15px`) across `320–2560` | Verified in `qa_phase6_full.cjs` + visual inspection (`services-p6-home-1280.png`, `services-p6-home-375.png`) | ✅ pass |
| S-2 | Multi-viewport `/services` | Hero words unclipped (`word1Clips: false`, `word2Clips: false`), 7 hero pills + 7 blocks + 7 SVGs (`navCount: 7`, `blockCount: 7`, `artworkCount: 7`), `navOverflow: false`, `cookieOverlapsNav: false`, `clientsVisible: false`, tap targets (`minChipH >= 44`, `minCtaH: 44`), `overflowX: 0` across `320–2560` | Verified in `qa_phase6_full.cjs` + visual inspection (`services-p6-hero-1280.png`, `services-p6-blocks-1280.png`, `services-p6-mobile-375.png`) | ✅ pass |
| S-3 | Client swaps + deep link | 5 transitions (`/` → `/services` → `/about` → `/services` → `/contact` → `/`) + `/services#ai-automation` click: WebGL canvas reattached (`1280x800`), `#ai-automation` scrolled under sticky header (`top: 99px`), active sidebar `05 AI & Automation`, `errors: []`, `legacyMediaRequests: []` | Verified in `qa_phase6_full.cjs` | ✅ pass |
| S-4 | `prefers-reduced-motion` | Home cards + inners resolve `transform: none` cleanly (`cardsNone: true`, `innersNone: true`); `/services` pulse transition `0s` and all 7 blocks render statically | Verified in `qa_phase6_full.cjs` | ✅ pass |
| S-5 | Asset cleanup | Phase 5 removed 41 legacy `public/videos/services/*` & `public/images/clients/*` files totaling `11,028,019` bytes (~10.52 MiB / 11.03 MB), replaced by inline 7-motif `ServiceArtwork.astro` SVGs (0 video/client requests) | Verified via `git ls-tree -rl 3be67f5~1` + zero legacy requests on preview | ✅ pass |
| S-6 | `web-design-guidelines` SVG/DOM hygiene | Decorative `.parts-serviceCard__slash`, duplicate `.part-btnPrimary__text` roll span, and CTA arrow `<svg>` on `/` lacked `aria-hidden="true"` | Fixed in `src/components/Hero.astro`; zero assistive-tech duplication | ✅ fixed |
| S-7 | `web-design-guidelines` touch, numerals & focus | Added `touch-action: manipulation`, `font-variant-numeric: tabular-nums`, and explicit `2px solid` `:focus-visible` rings in `src/styles/decbricks.css`; verified via real `Tab` navigation (`matchesFocusVisible: true` on `.parts-serviceNavLink`, `.parts-serviceBlock__cta`, `.parts-serviceCard__btn`) | Fixed & re-verified (`qa_phase6_focus_shot.cjs`) | ✅ fixed |
| S-8 | Lighthouse `/services` Desktop | `performance: 100`, `accessibility: 96`, `best-practices: 100`, `seo: 69` (`FCP: 0.3s`, `LCP: 0.3s`, `CLS: 0.027`, `TBT: 30ms`). Both desktop a11y flags (`color-contrast` on `.parts-btnBlock__index`, `label-content-name-mismatch` on `a.parts-btnBlock`) are inside pre-existing `Header.astro`; 0 failures in Services components | `seo: 69` caused by intentional `PUBLIC_ENV !== 'production'` `noindex` + `robots.txt` guard (`open-items.md` §E) | ℹ️ pre-existing / expected |
| S-9 | Lighthouse `/services` Mobile | `performance: 81`, `accessibility: 100`, `best-practices: 100`, `seo: 69` (`FCP: 1.1s`, `LCP: 1.1s`, `CLS: 0.374`, `TBT: 70ms`), `failed_a11y: []` | Elevated mobile `CLS` stems from pre-existing GSAP entrance/font reveal on `.parts-servicesHeroNavRow` shared by `/services`, `/about`, `/contact` | ℹ️ documented |

Re-verified gates after Phase 6 fixes: `build` ✅ · `check` ✅ (0 err) · `check:brand` ✅ · `headings` ✅ · `links` ✅ · `check:placeholders` ✅ · `check:footer` ✅.

---

## Code Cleanup & Bug Fix Verification (2026-11-14, branch `cleanup/2026-11-14`)

Full report: [`docs/cleanup/report.md`](file:///home/ankit/GitHub/decbricks/docs/cleanup/report.md) · Bug repros: [`docs/cleanup/bugs.md`](file:///home/ankit/GitHub/decbricks/docs/cleanup/bugs.md).

| ID | Category | Scope & Measured Evidence | Status |
|---|---|---|---|
| CL-1 | `BUG-016..022` lifecycle fixes | Resize `375->1280` with open menu clears `lenis-stopped` / restores `aria-expanded="false"` + `inert` + logo contrast; pre-consented Cal.com loads & empty `CAL.link` skips cleanly; client swaps (`/about <-> /` + multi-route `/about -> /services -> /contact -> / -> /about`) reattach `1280×800` WebGL canvases with `errs: []`, `badReqs: []` | ✅ fixed & verified |
| CL-2 | Dead asset & code scrub | Quarantined & deleted `BrandText.astro`, `fav1.png`, `32` dead `public/images/case-studies/` sticker files (`-3,075,122 B` in `dist/`), `menu.ts` `currentAnchor`, `footer.ts` `.structure-footer__marquee`, `brand.ts` `hasBrand`, `decbricks.css` `.parts-marqueeCursor__card`; tokenized card hexes cleanly; `noUnusedLocals` / `noUnusedParameters` enabled in `tsconfig.json` | ✅ fixed & verified |
| CL-3 | Multi-width & a11y parity | `overflowX: 0` across `320, 375, 768, 1024, 1280, 1920, 2560 px` and under `prefers-reduced-motion: reduce`; `0` console/page/HTTP errors; keyboard `Tab` focus order passes | ✅ pass |
| CL-4 | Phase 5 CSS purge (`cleanup/global-css-purge-2026-11-14`) | Pruned `src/styles/global.css` `157,642 B -> 97,735 B` (`-38.00%`, `-1,171` unused rules; `dist` CSS `-59,790 B`); 6-width × 5-route + 4 interactive states verified with `0` console/HTTP errors & zero layout/style regressions | ✅ verified on branch |

## Header desktop-nav state system (nav-bug fix, 2026-11-14)

Symptoms from a screen recording: CONTACT label disappears on hover ("invisible CONTACT"), states inconsistent (double indicators), numerals near-invisible, capsule edge vanishes on light pages.

### Root cause (exact selectors)

| Failure | Selector(s) responsible |
|---|---|
| CONTACT label 1.00:1 on hover/press | `Header.astro` `hover:bg-white` → compiled `.hover\:bg-white:hover{background-color:var(--color-white)}` flipped the pill to Off-White while the **unlayered** `.parts-btnBlock.bg-darkPurple{color:var(--brand-on-dark)}` (decbricks.css Phase-2 block) pinned the label cream — unlayered rules beat every layered utility, so `hover:text-darkPurple` never applied |
| CONTACT numeral "04" 1.69:1 | `.parts-btnBlock__index{color:var(--color-ink-muted)}` at 10px on the burgundy CTA pill |
| Double indicator (pill + underline) | `.structure-navPill .parts-btnBlock.router-link-active::after{background:currentColor}` fired on **every** current item; CONTACT-current = dark pill + cream underline; hover + underline coexisted on light items |
| Hover/focus pill invisible | `.hover\:bg-white:hover` / `.focus\:bg-white:focus` painted an Off-White fill on the 0.92-Off-White capsule ≈ 1.05:1 |
| Capsule edge invisible on light | `.structure-navPill` had no border/shadow — capsule fill vs Off-White backdrop = 1.00:1 |

### Backdrop census

Only **burgundy `rgb(128,0,32)`** and **Off-White `rgb(255,249,242)`** ever sit behind the header (probed `elementFromPoint` at header height across `/`, `/about`, `/services`, `/contact` at every themed section + footer). Beige/sage never reach header height; sage/olive appear only inside components below it. The matrix is therefore 2 backdrops × states × 4 items.

### Before matrix (measured, default states)

| Backdrop | Capsule edge | Light-item label | Light-item numeral | CONTACT label | CONTACT numeral |
|---|---|---|---|---|---|
| Burgundy | 8.86 ✅ | 8.86 ✅ | 5.26 ✅ | 10.36 ✅ | **1.69 ❌** |
| Off-White | **1.00 ❌** | 10.36 ✅ | 6.15 ✅ | 10.36 ✅ | **1.69 ❌** |
| Any · CONTACT hover/pressed | — | — | — | **1.00 ❌** (pill & label both Off-White) | — |
| Any · light-item hover pill | — | — | — | — | pill vs capsule **≈1.05 ❌** (invisible fill, label still legible) |

### After matrix (measured — label/numeral vs effective pill background, alpha-composited)

| State | Burgundy backdrop | Off-White backdrop |
|---|---|---|
| Default (WORK/ABOUT/SERVICES) | 8.86 | 10.36 |
| Default (CONTACT) | 10.36 | 12.25 |
| Hover light item (beige fill) | 12.25 | 8.82 |
| Hover CONTACT (darkerPurple) | 12.25 | 12.25 |
| Pressed light item | — | 6.86 |
| Pressed CONTACT (darkestPurple) | 13.89 | — |
| Focus (any item; label unaffected) | ring 8.86 vs capsule | ring 8.86 vs capsule |
| Hover transition (rAF-sampled ~16ms × 40 frames, in + out) | **min 10.36** every frame | — |
| Scroll-under-hover (157 frames) | min 8.82 | min 8.82 |

Capsule edge: fill-vs-backdrop is 8.86 on burgundy, 1.00 on Off-White — but the new full-opacity burgundy 1px hairline vs Off-White = **10.36**, so a ≥3:1 edge exists on every backdrop (fill provides it on dark, hairline on light).

Current page (one indicator): WORK pill on `/`, ABOUT on `/about`, SERVICES on `/services`, CONTACT dark pill + Off-White underline on `/contact` (only remaining underline, so "current" ≠ "CTA default"). No underline on any other item in any state. `aria-current` + `router-link-active` stayed in sync through a 5-hop client-side gauntlet (`/→/services→/contact→/about→/`).

Regression: below-header pixel diff with the 14 new rules toggled off/on via CSSOM = **0 changed pixels** on `/about` and `/contact` (noise baseline 0); on `/` the diff (6.3%) is below the WebGL hero animation noise baseline (12.3%) and confined to the hero canvas. Widths 1024–2560: capsule 485×54 at identical right-edge offset, item widths constant, no overflow. Mobile (<1024): nav `display:none`, menu button 91×44, menu opens.

Evidence: `docs/qa/shots/nav-before-contact-hover-{burgundy,offwhite}.png`, `nav-after-contact-hover-{burgundy,offwhite}.png`, `nav-after-{default-dark,hover-work,focus-work,current-home,current-contact,hover-about-light}.png`, `nav-w{1024,1280,1440,1920,2560}-{dark,light}.png`, `nav-mobile-{390,menu-open}.png`.

---

## ContactForm Halftone Illustration Containment Fix (2026-11-14)

### Root cause & precedent

In `src/components/ContactForm.astro`, the inner `max-w-1920 overflow-hidden` wrapper closes after `</form>`, leaving the two halftone illustration wrappers (`computer-back` `z-index: auto` and `computer-front` `z-index: 2`, both `position: absolute`) as direct children of `<section id="contact" class="sections-contactForm">`. At `lg+` (`>=1024px`), both carry `lg:top-[-10vw]`, pulling them `102.39px–256px` above `.sections-contactForm`'s top edge. Prior fixes (`357319e` on `/about` and `34c55c9` on `/services`) added an opt-in `clipIllustration` prop (`.sections-contactForm--clipIllustration`), while `/contact` (`contact.astro`) and `/` (`index.astro`) omitted it and left `.sections-contactForm` with `overflow: visible`. Because `.sections-contactForm` follows the preceding section in DOM order and `computer-front` has `z-2`, the monitor art painted upward over `.sections-servicesList` on `/contact` and over `#testimonials` (`.tst-band`) on `/`. `ScrollTrigger.refresh()` had zero effect on the overlap (pure CSS offset, not parallax/ScrollTrigger; identical across `atTop`, `atBoundary`, and `atDeep` scroll positions).

### Why `elementsFromPoint` initially skipped the art

Both wrappers carry `pointer-events: none`, so browser hit-testing passes through them even though they paint on top. Probing `(1240, 520)` and art top-edge points `(1210, 453)`, `(1210, 503)`, `(1028, 463)` on `/contact` (`1920×1053`) with temporary `pointer-events: auto` on those wrappers confirmed `img[alt="computer-front"]` (`top: -192px; z-index: 2`) painted topmost over `#start-a-project`'s `div.relative.z-1`, followed by `img[alt="computer-back"]`. After the fix, repeating that same probe returns `article.parts-serviceBlock` / `div.relative.z-1` (`#start-a-project` island) topmost with zero `ContactForm` images above the boundary.

### Before vs. After overlap table (`contactTopDoc - artTopDoc`; negative = art sits below section top = 0 px upward overlap)

| Page | Width | Before (raw / painted) | After (raw / painted) | Upward overlap after |
|---|---|---|---|---|
| `/contact` | `2560×1440` | `256 px` | `0 px` | **0 px** |
| `/contact` | `1920×1053` | `192 px` | `0 px` | **0 px** |
| `/contact` | `1440` | `144 px` | `0 px` | **0 px** |
| `/contact` | `1280` | `128 px` | `0 px` | **0 px** |
| `/contact` | `1024` | `102.39 px` | `0 px` | **0 px** |
| `/contact` | `768` | `-76.8 px` | `-76.8 px` | **0 px** |
| `/contact` | `375` | `-37.5 px` | `-37.5 px` | **0 px** |
| `/` | `2560×1440` | `256 px` | `0 px` | **0 px** |
| `/` | `1920×1053` | `192 px` | `0 px` | **0 px** |
| `/` | `1440` | `144 px` | `0 px` | **0 px** |
| `/` | `1280` | `128 px` | `0 px` | **0 px** |
| `/` | `1024` | `102.39 px` | `0 px` | **0 px** |
| `/` | `768` | `-76.8 px` | `-76.8 px` | **0 px** |
| `/` | `375` | `-37.5 px` | `-37.5 px` | **0 px** |
| `/about` | `2560..1024` | `0 px` *(opt-in)* | `0 px` | **0 px** |
| `/about` | `768` / `375` | `0 px` *(unscoped `top:0`)* | `-76.79 px` / `-37.5 px` | **0 px** |
| `/services` | `2560..1024` | `0 px` *(opt-in)* | `0 px` | **0 px** |
| `/services` | `768` / `375` | `0 px` *(unscoped `top:0`)* | `-76.8 px` / `-37.5 px` | **0 px** |

### Client-side swaps, resize, pixel-diff & gates

- **6-swap client navigation gauntlet** (`/contact → /services → /about → / → /contact → /services → /contact` at `1920×1053`): `overlapRaw: 0`, `overlapPainted: 0` on every hop; `ScrollTrigger.getAll().length` stable (`13` on `/contact`, `23` on `/services`, `23` on `/about`, `43` on `/`); WebGL canvases reattached (`1920×1053`, `connected: true`); `consoleErrs: []`, `pageErrs: []`.
- **Resize / orientation check** on `/contact` post-swaps (`1280×800 → 375×812 → 812×375 → 1920×1053`): `0 px` upward overflow (`0`, `-37.5`, `-81.19`, `0`).
- **Before/after pixel diff (`1920×1053`):** `y=0..440` above the leak on `/contact` and `/` changed `0/844800` pixels (`0.0000%`); `contact-top`, `about-boundary`, and `services-boundary` differed `0.0105%–0.0198%` strictly in the animated smiley pill / WebGL grain.
- **Evidence screenshots:** `docs/qa/shots/{contact,home,about,services}-{before,after}-boundary-1920.png`, `contact-{before,after}-boundary-{1280,375}.png`, `contact-{before,after}-{top,section}-1920.png`.
- **Static & build checks:** `npm run check` (`0` err, `0` warn, `1` pre-existing hint in `footer.ts`), `npm run build` (`5` pages), `npm run check:brand`, `npm run headings`, `npm run links`, `npm run check:placeholders`, `npm run check:footer` all pass.
- **Not verified:** Real Safari / iOS WebKit (Chromium-only test environment).

### Secondary findings (Step 4 — logged, no header redesign)

| ID | Sev | Area | Observation |
|---|---|---|---|
| `CF-S1` | S3 | Header logo chip (`a.parts-animatedLogo`) & nav capsule during scroll | On scroll (`menu.ts`), the logo chip gets `bg-white/70 backdrop-blur-xl` without border/shadow (`contact-after-boundary-1920.png` clips `"ONLINE BOOKING IS COMING SOON."` text passing behind it, while nav capsule `.structure-navPill` has `0.92` cream + `1px` burgundy border + shadow). Over `#FFF9F2` island body text, fixed transparent/light overlays are intended to float, though `a.parts-animatedLogo` lacks `.structure-navPill`'s stronger `0.92` opacity + subtle border treatment. |
| `CF-S2` | Info | `#book-a-call` fallback & header clearance | `"ONLINE BOOKING IS COMING SOON."` + dev hint is confirmed to be `CalEmbed.astro`'s intentional `CAL.link === ''` fallback (`docs/open-items.md` `A2`), not a rendering error. At `scrollY=0`, `#book-a-call h2` sits at `y=1164` (`headerBottom=83`); clicking `a[href="#book-a-call"]` scrolls to `y=915` leaving `#book-a-call h2` at `top: 249` vs `headerBottom: 83` / `navPillBottom: 82` (`166 px` clear). |
| `CF-S3` | Info | Vertical sidebar nav (`01–04`) at `1280` & `1440` | At `#start-a-project`, sidebar is visible (`navInert: false`), active item matches `["#start-a-project"]`, and text right edges stay clear (`max textRight: 781 px` vs `navLeft: 1222 px` at `1280` and `1382 px` at `1440` → `coveredByNav: false`). |

---

## Testimonials Spotlight Upgrade — Direction 1 (2026-11-14)

- **Design & layout verdict:** Architectural burgundy frame (`.tst-inner` coral hairline + `9 px` `.tst-corner` ticks, `25 px` grid backdrop, `.tst-cardTop` FK Raster index + service pill, Bricolage Grotesque `500` quote copy, Warm Beige `.tst-attr` plinth) paired with simplified `[01 | Name / Role, Company]` rail rows and `<= 1023 px` scroll-snap strip.
- **Responsive geometry (`2560, 1920, 1440, 1280, 1024, 768, 375`):**
  - `overflowX: 0 px` at all 7 widths; `prev`/`next`/`.tst-railMore` targets all `>= 44×44 px` (`moreHeight: 44`).
  - Desktop (`>= 1024 px`) stage vs rail alignment: `stageTopVsRailTopDelta: 0`, `stageBottomVsRailBottomDelta: 0`, `ctrlTopVsMoreTopDelta: 0`, `ctrlBottomVsMoreBottomDelta: 0`.
  - Band / stage heights: `886 / 408` (`2560, 1920`), `841 / 400` (`1440`), `782 / 376` (`1280`), `704 / 364` (`1024`), `667 / 314` (`768`, compact horizontal strip vs `917 px` before), `644 / 318` (`375`).
  - Rail text truncation (`scrollWidth > clientWidth`): `[]` across `2560..768`; `1` item at `375` (`Publishing Director, Quillmark Games` inside card `8` of the `317 px` horizontal strip card).
- **WCAG Contrast (in-page canvas pixel composition of `oklab`/`color-mix`, identical across all 7 widths):**
  - `quoteOnCard`: **10.36:1** · `nameOnPlinth`: **8.82:1** · `subOnPlinth`: **5.72:1** · `chipOnCard`: **6.08:1**
  - `railActiveOnCard`: **10.36:1** · `railActiveSubOnCard`: **6.09:1** · `railInactiveOnBand`: **8.82:1** · `railInactiveSubOnBand`: **6.63:1**
- **Behavior & lifecycle (`1440` + reduced-motion + 4-swap SPA):** `/#t-4` deep link (`04 / 08`), Next (`05 / 08`, live region `"Quote 5 of 8"`), `ArrowDown` (`06 / 08`), `Home` + `+1 more` button scroll & hide, `MomentumHover` active tilt transform, `prefers-reduced-motion: reduce` (`cardTransition: 0s`, `innerTransform: none`), and 4-swap SPA gauntlet (`/ → /services → /about → /contact → /`) returning cleanly with `errs: []`, `postSwapIdx: "02 / 08"`, and reattached WebGL canvases (`["1440x900:true", "1440x900:true"]`).
- **Build & static gates (post-final-edit):** `npm run check` (`0` err, `0` warn, `1` pre-existing hint in `footer.ts`), `npm run build` (`5` pages), `npm run check:brand`, `npm run check:placeholders` (`8 testimonials, 0 placeholder, 8 consented`), `npm run headings`, `npm run links`, `npm run check:footer` all pass.
- **Evidence shots:** `docs/qa/shots/tst-after-{1440,1440-long,1280,768,375}.png`.
- **Not verified:** Real Safari / iOS WebKit (Chromium-only Playwright run).


## Contact Form → Formspree Wiring (2026-11-14, open-items A7)

- **Scope:** `ContactForm.astro` (+`method=POST`/`action=PUBLIC_CONTACT_ENDPOINT`, hidden `_gotcha`/`_subject`/`source_page`, 5 per-field error `<p class="form-fieldError">`, `maxlength=5000` on message, focusable `#status-message`), `contact.ts` (real fetch POST with per-field `errors[]` mapping, 429/timeout/offline branches, 15s AbortController timeout, 20s cool-down, honeypot, teardown abort), `src/data/contact.ts` (dev-only console warning when endpoint empty), `decbricks.css` (`.form-fieldError`), `buttons.ts` (`setBtnPrimaryLabel()` — SplitText `autoSplit` owns `.part-btnPrimary__text` text and reverts direct writes on re-split, so label swaps must tear the split down, set text, re-split), `.env` + `.env.example`.
- **Mocked matrix 50/50 PASS** (`docs/qa/contact-form-matrix.cjs`, route-mocked `https://formspree.io/**`, never hits the real endpoint): success 200 `{ok:true}` (1 request, `Accept: application/json`, payload `email/name/company/message/terms`, `_gotcha` empty, `_subject` "New enquiry from Jane Doe - Decbricks", `source_page` = `location.pathname`, form reset, focus → `#status-message` role=status); 422 (inline error under email, role=alert, focus first invalid, inputs preserved, typing clears); 429 (specific copy, no field errors); 500 (generic copy, inputs preserved); offline (`setOffline`, "could not reach the server"); >15s timeout (request aborted, inputs preserved, button re-enabled); honeypot filled ⇒ silent fake success + **zero** requests; double-click ⇒ **one** request, inputs never disabled (readonly instead); cool-down ⇒ "please wait 19s" + no extra request; empty submit ⇒ no request, inline errors, focus `#email`; terms unchecked ⇒ `#terms-error`.
- **Keyboard + layout:** tab order from `#email` = name → company → message → terms → submit; terms toggles via Space; submit works from keyboard. 375px: no horizontal scroll, inline error renders (`contact-375-errors.png`).
- **Lifecycle:** 7-load gauntlet (`/ → /about → /services → /contact → / → /services → /contact`) then submit ⇒ exactly 1 request, console clean (no double binding across client-side swaps; teardown aborts in-flight requests).
- **Live verification (owner-approved, exactly one submission):** HTTP 200, status "Message sent." — real delivery to the owner's inbox still to be confirmed by the owner (spam folder too), see open-items A7 dashboard to-dos.
- **reCAPTCHA note:** none exists in markup or scripts (AGENTS.md was stale) — no copy change made.
- **Not verified:** real Safari/iOS WebKit, Formspree dashboard settings (recipients/spam/reCAPTCHA/allowed domains), actual inbox delivery.

## Legal Draft Pages + Contact Tick Checkbox (2026-11-14, open-items A11)

- **Scope:** `src/data/legal.ts` (typed `LEGAL_DOCS`: Terms 14 sections, Privacy 11 sections — every company-specific fact a bracketed placeholder; privacy copy truthful to what the site does: Formspree, optional Cal.com, cookie banner functional + optional analytics, server logs), `src/components/LegalPage.astro` (404-shell mirror: Base → Header → dark `data-theme` strip → light island → Footer; no sidebar, no page JS), `src/pages/terms.astro` / `src/pages/privacy-policy.astro`, `src/data/footer.ts` legal links `enabled: true`, `ContactForm.astro` tick glyph + template-verbatim label links (`target="_blank" rel="noopener"`), `decbricks.css` (`.legal-list` disc markers + `.parts-formCheckbox .relative input:focus-visible + div` ring).
- **Legal pages matrix 29/29 PASS** (`docs/qa/legal-pages.cjs`): both pages exist (200, not 404 shell), exactly one H1 naming the doc, ≥5 H2 sections, bracketed placeholders visibly rendered, `noindex` while draft, no contact form embedded, console clean, footer + label links present on the pages themselves, 375px no h-scroll; contact label: two links, `target=_blank`, **link click does not toggle the checkbox**; footer: Privacy + Terms enabled on `/`; 7-route gauntlet (`/ → /about → /services → /contact → /terms → /privacy-policy → /contact`) then submit ⇒ exactly 1 request, console clean.
- **Tick checkbox 12/12 PASS** (`docs/qa/contact-tick.cjs`): SVG exists scoped to `form.sections-contactForm__form .parts-formCheckbox` (CookieBanner shares the class — unscoped queries are wrong); hidden unchecked → visible checked (click + Space ×2 + label-click untoggle); hidden after successful submit (reset path); success ⇒ 1 request; validation path intact (`#terms-error`); 375px glyph visible in box + no h-scroll; **keyboard focus rings the visible box** (`outline 2px solid` via `:focus-visible` sibling rule — RED first: 3px/`none` outline invisible).
- **Form regression 50/50** (`docs/qa/contact-form-matrix.cjs`; tab-order expectation updated: from `#email` = name → company → message → terms → **Terms link → Privacy link** → Submit, DOM order — anchors don't toggle the checkbox, verified).
- **Reduced motion:** both legal pages load with `prefers-reduced-motion: reduce`, H1 + content visible, 0 console/page errors.
- **Built dist checks:** form action intact; no env vars/secrets in `dist/`; both legal pages built with visible `Last updated: TEMPLATE DRAFT` stamp; **excluded from `sitemap.xml`** (0 matches); brand gate passes across all 7 pages.
- **Gates:** `build` (7 pages) · `check` (0 err, 1 pre-existing hint) · `check:brand` · `headings` · `links` · `check:placeholders` · `check:footer` — all ✅.
- **Evidence shots:** `docs/qa/shots/legal-{terms,privacy-policy}-{1280,375}.png`, `contact-tick-{1280,375}.png`, `contact-tick.txt`, `legal-pages.txt`.
- **Not verified:** real Safari/iOS WebKit; screen-reader announcement of the tick (glyph is decorative, `aria-hidden`, state conveyed by the real checkbox — semantics reviewed statically); legal text accuracy (owner + legal review, A11).

## Monumental Legal Pages (2026-11-14, plan 2026-11-14-monumental-legal-pages)

- **Scope:** `LegalPage.astro` restructured to the approved "monumental legal · A2" design — dark burgundy hero (giant FK-Raster title + coral period, draft stamp, 3 derived meta chips, tilted 7×5 pixel-brick wall server-rendered from a fixed pattern), light reading island with giant olive FK numerals above each verbatim heading, fixed right-edge numbered rail (`legal-rail`, ServicesSidebarNav precedent), reading-progress hairline, back-to-top. New `src/scripts/legal-page.ts` (init+teardown, registered in `main.ts` boot AND `onAfterSwap`): brick build-in stagger, one-shot IO section reveals, scroll-spy `aria-current`, Lenis-aware rail jumps (90px header offset), progress scaleX, back-to-top. CSS only in `decbricks.css` (`.legal-*` block); copy verbatim from `legal.ts`; `noindex`/sitemap exclusion/`data-legal-draft-stamp` untouched.
- **Monumental matrix 64/64 PASS** (`docs/qa/legal-monumental.cjs`): hero on both routes (dark theme, burgundy bg, full title in one h1, stamp, 3 chips incl. draft notice, ≥20 wall bricks contained to the page, ≥3 placeholders visible, 3px progress hairline, back-to-top hidden at top, console clean, 375px no h-scroll); rail (fixed right, 14/11 links, `01` first, every href resolves, numerals olive ≥48px aria-hidden, hidden at 375); motion (brick build-in caught mid-stagger then settled, sections visible, scroll-spy sets aria-current, progress scaleX→~1 at bottom, back-to-top appears/click-returns/hides, rail jump lands ≥60px below header, console clean); reduced-motion (all bricks + sections fully visible at load, rail present, console clean); swap gauntlet (`/ → /terms → /privacy-policy → /` then client-side to privacy: one progress bar, console clean); 375-after-init.
- **Regression:** `legal-pages.cjs` 29/29 · `contact-tick.cjs` 12/12 · `contact-form-matrix.cjs` 50/50.
- **Gates:** build (7 pages) · check (0 err, 1 pre-existing hint) · check:brand · headings · links · check:placeholders · check:footer — all ✅. Dist: noindex on both legal pages, sitemap excludes them, form action intact, no env leakage.
- **Evidence:** `docs/qa/shots/legal-hero-{terms,privacy-policy}-{1280,375}.png`, `legal-island-*-375.png`, `legal-monumental.txt`.
- **Not verified:** real Safari/iOS WebKit; the build-in moment under a real 4G connection (Chromium-only run).

## Legal heroes adopt ServicesHero treatment (2026-11-15, plan docs/superpowers/plans/2026-11-14-legal-hero-services-treatment.md)

- **Scope:** owner request — legal heroes restyled to the About/Services hero treatment (flares, subtext, smiley sticker, bold FK Raster Compact) and all "points" converted to paragraphs. `LegalPage.astro` now renders `<ServicesHero srTitle headingParts heroHeading body={doc.intro} navItems={[]}>` with the draft stamp through the hero's new default slot; A2 wall/chips/custom title removed; privacy §2 bullets became verbatim body paragraphs; dead `.legal-hero*/.legal-brick*` CSS stripped (`.legal-hero__stamp` kept for the slotted stamp); `legal-page.ts` init re-guarded on `.page-legal`, brick build-in deleted (hero motion belongs to `initServicesPage`).
- **Monumental matrix 69/69 PASS** (`docs/qa/legal-monumental.cjs`): ServicesHero hooks on both routes (dark theme, sr-only h1 = full doc title, one h1, smiley subtext visible carrying the draft notice, FK display words, trail svg, NO pill row, stamp visible in slot, 0 chips/0 bricks, page contained, placeholders ≥3, 3px progress hairline, top hidden at top, console clean, 375 no h-scroll); rail/numerals/motion/reduced-motion/swap-gauntlet/375-after-init unchanged and green; §2 prose (0 bullet lists, words preserved).
- **Regression:** `legal-pages.cjs` 29/29 · `contact-tick.cjs` 12/12 · `contact-form-matrix.cjs` (see PROGRESS). One transient Chromium-launch collision when three suites ran concurrently — rerun clean.
- **Gates:** build (7 pages) · check (0 err, 1 pre-existing footer email hint) · check:brand · headings · links · check:placeholders · check:footer — all ✅. Dist: noindex both pages, sitemap excludes them, no brick/chip/wall output, stamp + form action intact.
- **Evidence:** `docs/qa/shots/legal-hero-{terms,privacy-policy}-{1280,375}.png`, `legal-monumental.txt`.


## Cal.com Booking Block Fix & Brand Polish (2026-11-15)

- **Root causes fixed:**
  1. **Accidental beige wings & bottom dead gap:** `.cal-embed` had `w-full bg-lightPurple` (`1788 px` wide at `1920 px`), while Cal's desktop `[data-testid="booker-container"]` caps at `1040 px`, leaving `~374 px` dead beige panels on both sides plus bottom padding above `Cal.com`. Replaced full-width beige fill with a centered hugging frame (`.cal-frame`, `max-width: 1066 px`, `12 px 12 px 6 px` Warm Beige tray matte on `>= 640 px`, subtle hairline/shadow) so the `1040 px` Off-White booker fills the tray edge-to-edge (`deadLeftPx: 0`, `deadRightPx: 0` across all widths).
  2. **CLS jump from Cal's late `<style>` & `isFirstTime: true`:** `embed.js` injects `<style>.cal-embed{min-height:300px;display:block!important}</style>` into `<head>` after `decbricks.css` and emits an initial `__dimensionChanged` (`iframeHeight: 300, isFirstTime: true`), collapsing the `650/700 px` skeleton reserve to `300 px` and then expanding back to `570 px` (`1280+`) or `2105–2438 px` (`375–768`). Fixed by putting higher-specificity reserves on `.cal-embed-widget .cal-embed` + `.cal-frame` (`840/828 px` `<640`, `1020/1002 px` `640–1023`, `588/570 px` `>=1024`) and holding until `__dimensionChanged` (`isFirstTime: false`), then setting `min-height: 0; height: auto`.
  3. **Generic cool-grey Cal theme:** Extended `cal('ui', { theme: 'light', cssVarsPerTheme: { light: CAL_THEME_VARS } })` using 28 confirmed `--cal-*` keys observed in live iframe stylesheets (`#FFF9F2` surface, `#EAD7C0` available date tiles, `#F3E6D5` subtle fills, `#800020`/`#630018` selected date & primary CTAs, `#3D000F`/`#4A0E1E`/`#6B2D3B` burgundy-ink text, `#AE7480` 3.58:1 button outlines, `#5A6432`/`#E6ECE0` olive/sage success tones). Cal's free-plan `Inter` font and `Cal.com` footer watermark are platform-controlled and left as-is; host profile `"DecBricks Team"` casing lives in Cal Settings (open-items A2).

- **Before / After across viewports (Playwright Chromium, settled `#book-a-call`):**

| Width | Frame / Mount W (px) | Frame / Iframe H (px) | `overflowX` (px) | CLS (Before → After) | Inner Scrollables | Errors |
|---|---|---|---|---|---|---|
| `320` | `272` / `258` | `2072` / `2058` | `0` | — → `0.0707` | `0` | `0` |
| `375` | `327` / `313` | `2107` / `2093` | `0` | `0.5153` → `0.2278` | `0` | `0` |
| `768` | `720` / `694` | `2436` / `2416` | `0` | `0.8445` → `0.0466` | `0` | `0` |
| `1024` | `922` / `896` | `590` / `570` | `0` | `0.1452` → `0.0001` | `1` (slot list) | `0` |
| `1280` | `1066` / `1040` | `590` / `570` | `0` | `0.0990` → `0.0001` | `1` (slot list) | `0` |
| `1920` | `1066` / `1040` | `590` / `570` | `0` | `0.0774` → `0` | `1` (slot list) | `0` |
| `2560` | `1066` / `1040` | `590` / `570` | `0` | `0.0548` → `0` | `1` (slot list) | `0` |

- **Live iframe contrast matrix (`1280×900`):**
  - Selected date (`#FFF9F2` on `#800020`): **10.36:1** · Available date tile (`#3D000F` on `#EAD7C0`): **12.43:1** · Disabled date text (`#4A0E1E` on `#FFF9F2`): **14.63:1**
  - Slot button text (`#4A0E1E` on `#FFF9F2`): **14.63:1** · Slot border (`#AE7480` on `#FFF9F2`): **3.58:1** (`>= 3.0`)
  - Headers (`#4A0E1E` on `#FFF9F2`): **14.63:1** · Subtle captions (`#6B2D3B` on `#FFF9F2`): **9.73:1** · Active `24h` toggle pill: **6.86:1** · Details `Confirm` CTA (`#FFF9F2` on `#800020`): **10.36:1**
- **Behavior & lifecycle checks (`1280×900`):**
  - Booking flow (stop before submit): weekday click → `slotVisible: true` → slot click → details form rendered (`Confirm` CTA `10.36:1`) → `Back` restored month view cleanly without booking.
  - Anchor & header clearance (`a[href="#book-a-call"]` click): `headerBottom: 83 px`, `#book-a-call-heading` top `232 px` (`+149 px` clearance).
  - Keyboard focus: `Tab` from sidebar entered iframe and exited cleanly (`exitedIframeTo: A.font-neuePower` in `49` steps, zero focus trap).
  - Wheel scroll (`[data-lenis-prevent] iframe`): wheeling outside advances page (`y: 400 → 612`); wheeling inside slot column holds page (`612 → 620`) while scrolling slots.
  - Blocked `app.cal.com` host fallback: at `10151 ms`, `.cal-frame` hidden (`display: none`), `.cal-fallback` visible with `44 px` tap targets (`Book a call on Cal.com ↗`, `Email us`).
  - 6-swap SPA gauntlet (`/contact → /services → /about → / → /contact → /services → /contact`): `embedScriptCount: 1`, `ready: "true"`, `iframeCount: 1`, `mountH: 570`, `errs: []`.
- **Evidence shots:** `docs/qa/shots/cal-{before,after}-{375,768,1280,1920,2560}.png`.
- **Not verified:** Real Safari / iOS WebKit; real end-to-end Cal booking submission (stopped cleanly at the details form before `Confirm`).

### Cal.com Booking Block — Mobile Fixes (`/contact`, 2026-11-15)

- **Scope:** Flattened triple nested mobile frames into one card frame below `1024 px` (`wastedHorizontalPx` reduced `62–74 px → 28 px`), added `>= 44 px` `"Send the form below ↓"` escape hatch (`.cal-escape__link` → `#contact` + `#email` focus, hidden on `>= 1024 px` and in `.is-hidden`/blocked fallback), added header-aware guided scroll on `__routeChanged` (`~620 ms` settle after Cal's internal mobile scroll so `"Day Nth | 12h 24h"` clears the `62 px` fixed top bar at `y = 84 px`), and ensured accessible `iframe.title` (`"Book a call"`).
- **Before vs After matrix (Playwright Chromium, `0` console/page errors across all runs):**
  | Width | Before frame / wasted / H | After frame / wasted / H | `overflowX` | `slotCount` (`15m`) | `.cal-escape__link` |
  |---|---|---|---|---|---|
  | `320×568` | `258 px` (`62 px` waste) / `2058 px` | `292 px` (`28 px` waste) / `2087 px` | `0` | `32` (`09:00`–`16:45`) | `44 × 153 px` |
  | `360×740` | `298 px` (`62 px` waste) / `2081 px` | `332 px` (`28 px` waste) / `2110 px` | `0` | `32` | `44 × 153 px` |
  | `375×812` | `313 px` (`62 px` waste) / `2093 px` | `347 px` (`28 px` waste) / `2123 px` | `0` | `32` | `44 × 153 px` |
  | `390×844` | `328 px` (`62 px` waste) / `2106 px` | `362 px` (`28 px` waste) / `2135 px` | `0` | `32` | `44 × 153 px` |
  | `414×896` | `352 px` (`62 px` waste) / — | `386 px` (`28 px` waste) / `2156 px` | `0` | `32` | `44 × 153 px` |
  | `600×900` | `538 px` (`62 px` waste) / `2286 px` | `572 px` (`28 px` waste) / `2315 px` | `0` | `32` | `44 × 153 px` |
  | `767×1024` | `693 px` (`74 px` waste) / `2415 px` | `739 px` (`28 px` waste) / `2455 px` | `0` | `32` | `44 × 153 px` |
  | `768×1024` | `694 px` (`74 px` waste) / `2416 px` | `740 px` (`28 px` waste) / `2455 px` | `0` | `32` | `44 × 153 px` |
  | `1023×900` | — | `995 px` (`28 px` waste) / `1002 px` | `0` | `32` | `44 × 153 px` |
- **Single-frame & CLS verification (`< 1024 px`):** `.cal-frame` computed `border: 0px`, `padding: 0px`, `background: rgba(0, 0, 0, 0)`, `box-shadow: none`; Cal inner `[data-testid="booker-container"]` `0px` border (`320–768 px`). Natural page-load CLS observer at `scrollY = 0` recorded `0` across `320`, `360`, `414`, `600`, `768` (transient `0.02–0.14` appears only when tests force `scrollIntoView` onto the calendar mid-hydration).
- **Guided scroll, interactive controls & escape hatch (`360×740` & `375×812`):**
  - Picking weekday `17`: `slotsHeaderViewportY: 84` (`22 px` below `headerBottom: 62 px`); focus stayed in `IFRAME` (`activeElTag: "IFRAME"`).
  - Switching `25m` duration (`19` slots) → `24h` toggle → clicking time slot opened Step 2 details form (`heightOnDetails: 828`, `scrollDeltaOnDetails: 0`) → `Back` restored slots (`backedOut: true`).
  - Tapping `"Send the form below ↓"`: scrolled cleanly (`headerBottom: 62 px`, `formTop: 84 px`, `formTitleTop: 109 px`), focused `#email` (`focusVisibleOutline: "solid"`).
  - `prefers-reduced-motion: reduce` (`360×740`): immediate guided scroll + immediate jump to `#email` (`scrollY: 3580`).
  - Blocked `app.cal.com` host (`360×740`): `.cal-fallback` visible, `.cal-frame` and `.cal-escape` both hidden (`display: none`), `overflowX: 0`.
  - 5+ mobile SPA swaps (`375×812`, `/contact → /services → /about → / → /contact → /about → /contact`): `embedScriptCount: 1`, `iframeCount: 1`, `.cal-escape` functional (`activeIdAfterEscape: "email"`), `errs: []`.
- **Desktop non-regression (`1280×900` & `1920×1050`):** `.cal-escape` `display: none`; `.cal-frame` `1066 px` Warm Beige tray (`padding: 12px 12px 6px`, `1 px` border); `iframeW/H: 1040/570`; `clsTotal: 0.0001` (`1280`) / `0` (`1920`); `errs: []`.
- **Evidence shots:** `docs/qa/shots/cal-mobile-{before,after}-*.png`, `docs/qa/shots/cal-desktop-after-{1280,1920}.png`.
- **Not verified:** Real iOS Safari / Android Chrome touch overscroll chaining and rubber-band behaviour; real end-to-end Cal booking confirmation (stopped before `Confirm`).
