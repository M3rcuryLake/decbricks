# Component mapping — Decbricks ⇄ 1minus1 template

## Page assemblies

### /services (reference, `src/pages/services.astro`)
`Base` → `#__nuxt > main.layout` → `Loader` → `div.page.page-services` → `Header`, `ServicesHero`, `section.sections-servicesList[data-theme=light]` (white island → `max-w-1850 flex-col gap…` → `ServiceBlock ×7`), `ServicesSidebarNav`, `ServicesClients`, `ContactForm`, `Footer`; siblings `CookieBanner`, `TransitionOverlay`; `<script>import '../scripts/main'</script>`.

### /about (NEW) — same shell
| Slot | Component | Change |
|---|---|---|
| hero | `ServicesHero` | add props `{ srTitle, headingParts, body, navItems }`; defaults = current services values. About: srTitle "About Decbricks", headingParts ['About','Decbricks'], body = tagline + first paragraph |
| hero in-page nav (`.parts-serviceNavLink`) | inside ServicesHero | driven by `navItems` (id + label) |
| content island `max-w-1850 …` | **NEW `AboutBlock.astro`** cloned from `ServiceBlock` chrome (4 corner squares, giant numeral, alternating layout, `border-darkestPurple/15`) minus capabilities/projects | content from `src/data/about.ts` (verbatim from docs/about-section-data.md) |
| block media column (all 7 sections) | `AboutBlock.astro` | same classes as ServiceBlock's media column (`lg:w-260 xl:w-300 3xl:w-360 4xl:w-410` + `aspect-4/5 rounded-40 rounded-tr-none`), `<Picture formats={['avif','webp']} fallbackFormat="webp" quality={50}>`; `image?: {src, alt, position?}` in `about.ts`; tags row dropped (no data). |
| side nav | `ServicesSidebarNav` | add props `{ items, ariaLabel }`; default = SERVICES |
| clients strip | `ServicesClients` | **omit** on About (1minus1 logos; brief doesn't list it). Verify `services-page.ts` null-guards `.sections-servicesClients` |
| form | `ContactForm` | add props for smiley copy + heading words (currently hard-coded "Begin your / story", games copy) |
| footer | `Footer` (`FooterCta`, `FooterNav`, `FooterContact`, `FooterStatus`, `FooterWordmark`, `FooterLegal`, `FooterWebgl` + `src/data/footer.ts`) | Concept A "Foundation": brick-laid FK Raster wordmark, data-driven nav/contact/status (empty slots hide until owner data supplied), `cta="auto"` omits redundant CTA on `/contact` (emits `<h2 class="sr-only">Site footer</h2>`) |

About section list → blocks (numeral / eyebrow / H2 / content):
01 Intro — "Who we are" · H2 "Building Technology. Empowering Businesses. Driving Growth." (the doc's `# About Decbricks` is the page H1 via hero) — 2 paragraphs + "technology should serve a purpose" paragraph
02 "What Drives Us" · 03 "Our Mission" · 04 "Our Vision" · 05 "Our Values" (5 items as H3: Innovation, Commitment, Collaboration, Quality, Growth) · 06 "Our Experience" · 07 "Our Philosophy" (+ closing line "Decbricks. Building ideas into reality.")
Sidebar items = the 7 blocks (labels: Who We Are, What Drives Us, Mission, Vision, Values, Experience, Philosophy). Check `services-page.ts` for any assumption of exactly 4 items (`li[data-slot]`, index maths).

### /contact (NEW, replaces broken `contact.astro`)
Same shell as About. Content island holds, in order, as blocks with the same card chrome:
1. **Book a meeting** — Cal.com inline embed (`CalEmbed.astro` + `scripts/cal-embed.ts`)
2. **Let's Start Something Great.** (H2) / **Tell us what you want to build.** (H3) / the two paragraphs (verbatim from brief §4.2 B — **A15: brief missing, placeholder nav sentence until supplied**)
3. **Meet the Team** — `TeamSection.astro` (single component; separate `TeamCard.astro` merged into it — deviation logged in Design-handoff), data `src/data/team.ts`
4. **Contact Numbers** — `ContactNumbers.astro`, data `src/data/contact.ts`, `tel:` links
then `ContactForm`, `Footer`. Hero: srTitle "Contact Decbricks"/headingParts ['Contact','Us'].
Sidebar items: Book a Call, Start a Project, Team, Call Us.
Blocks 3+4 hide while their arrays are empty (dev warnings; sidebar item no-ops).

## Class hooks scripts depend on (do not rename; null-guard)
- services-page.ts: `.sections-servicesHero`, `.sections-servicesHero__trail`, `.sections-servicesList`, `.sections-servicesSidebarNav`, `.sections-servicesSidebarNavItem(__bullet|__index|__label|__text)`, `.parts-serviceNavLink(__label)`, `.sections-servicesClients`, `.structure-loader`, `.structure-menu`, `li[data-slot]`
- contact.ts: `.sections-contactForm`, `.parts-form`, `.parts-formCheckbox`, `.part-btnPrimary__text`, `input/textarea[name]`
- cal-embed.ts (updated 2026-11-15): `.cal-embed-widget[data-has-cal]`, `.cal-escape` / `.cal-escape__link` (mobile `< 1024 px` smooth-scroll jump to `#contact .sections-contactForm__form` + focus `#email`, hidden alongside `.cal-frame.is-hidden`), `.cal-frame[data-cal-ready]` (mobile `< 1024 px` borderless `-10 px` bleed inside `#book-a-call`; `>= 1024 px` hugging `max-width: 1066px` tray + visibility/CLS control beating `embed.js`'s injected `.cal-embed` rule), `.cal-embed[data-lenis-prevent]`, `.cal-skeleton`, `.cal-fallback`, `.cal-status` (unsubscribes `bookingSuccessful` / `linkFailed` / `linkReady` / `__routeChanged` / `__dimensionChanged` via `cal('off', ...)` + `disposed` + timer cleanup on teardown)
- legal-page.ts (2026-11-15): `.legal-progress`, `.legal-top`, `.legal-island`, `.legal-section`, `.legal-list`, `.legal-docBody`, `.legal-clauseTitle`, `.legal-privacyTitle`, plus `.legal-hero__stamp` (rendered through ServicesHero's default slot via `data-legal-draft-stamp`) — unified `/terms#privacy-policy` in `LegalPage.astro`; registered in main.ts boot AND onAfterSwap; reveal = one-shot IO (NOT ScrollTrigger — transitions bulk-kill STs); init guard = `.page-legal`. **Hero:** shared `ServicesHero` with `navItems={[]}`.
- contact.ts: `.sections-contactForm`, `.parts-formCheckbox`, `.part-btnPrimary__text`, `input/textarea[name]`. **Formspree submission (2026-11-14, A7):** form `#email #name #company #message #terms` + `#terms`-error/`#email-error`/`#name-error`/`#company-error`/`#message-error`/`#terms-error` (`.form-fieldError`, decbricks.css), `#status-message` (aria-live, focus target), hidden `input[name="_gotcha"]` (honeypot), `input[name="_subject"]` + `input[name="source_page"]` (JS personalises per submit); `form[method=POST][action=PUBLIC_CONTACT_ENDPOINT]`; button label changes MUST go through `setBtnPrimaryLabel()` (buttons.ts) — SplitText owns `.part-btnPrimary__text` textContent; direct writes are reverted on re-split. **Tick (2026-11-14):** `.parts-formCheckbox svg` = template pixel-check glyph, `opacity-0` default, toggled by contact.ts `syncCheckbox()` on change/reset/success; keyboard focus rings the box via `.parts-formCheckbox .relative input:focus-visible + div` (decbricks.css). The wrapper `is-valid` attribute is inert (0 CSS rules — verified 2026-11-14, left as template decoration). `.parts-formCheckbox` is also used by CookieBanner's close boxes — script/test queries MUST scope to `form.sections-contactForm__form`.
- **VERIFIED (Phase 0 / updated 2026-11-16):** services-page.ts imports `SERVICES`/`CLIENT_LOGOS` directly and drives all ScrollTrigger + sidebar/hero active-state logic from `SERVICES` (or `deriveNavItems()` for `/about` and `/contact`). `.sections-servicesClients` is null-guarded (early return; `CLIENT_LOGOS.length <= slots.length` → rotation off), and unreachable `ServiceArtwork`/`.parts-autoplayVideo` code was removed in repo cleanup. About/Contact reuse `.sections-servicesList` and keep `#contact` on ContactForm.
- contact.ts form logic: **RESOLVED 2026-11-14** — real Formspree POST (fetch, `Accept: application/json`), success only on `res.ok`; 4xx `errors[]` → per-field inline errors + summary; 429-specific copy; ~15s AbortController timeout; 20s in-memory cool-down; honeypot filled ⇒ silent fake success; teardown aborts in-flight request; no-JS fallback = Formspree's own POST page.
- ContactForm.astro: no reCAPTCHA note exists anywhere in `src/`.
- footer.ts: `.structure-footer(__inner|__wordmarkRow|__wordmark|__clock|__brick)`, `.parts-btnScrollTop`, `button[aria-label="Manage Cookies"]`; dead copy-email/`.structure-footer__marquee` code removed; `FooterWebgl.astro` isolates the global `canvas.webgl` pair in unchanged DOM order for `reattachCanvases()`
- testimonials.ts (home): `.tst-band` — spotlight hooks `.tst-*` (card/rail/controls). Old drag-canvas hooks `.sections-testimonials*`, `.parts-testimonialCard`, `.parts-testimonialMiniMap*`, `.parts-marqueeCursor` were removed WITH the component rewrite (deliberate no-rename-rule exception; nothing outside the section queried them — verified by grep at rewrite time). Amendment A 2026-11-14 (owner-locked) + Direction 1 Architectural Frame Polish (2026-11-14): the rail is a LISTBOX (`.tst-railList` role=listbox, `data-lenis-prevent`, `overscroll-behavior: contain`) with `.tst-railNum` + `.tst-railWho` rows (`div.tst-railOpt`, `aria-selected` + roving tabindex), synced dynamically via `equalizeStageHeight()` on desktop (`>= 1024px`, `stageH` min floor `364px`, `railList.style.maxHeight = `${stageH}px``) so featured stage and rail align top/bottom; `<= 1023px` (`mqStrip`) it switches to a horizontal scroll-snap strip; scroll cues are `.is-fadeTop`/`.is-fadeBottom` mask-image classes + `44px` `.tst-railMore` button (`+N more`, aligned flush with `.tst-controls`). Featured card uses `.tst-inner` (coral hairline + 4 decorative `.tst-corner` ticks), `.tst-cardTop` (`.tst-cardIndex` `01`..`08` in FK Raster + `.tst-chip` pill), `.tst-quoteWrap` + Bricolage `500` `.tst-quote`, and Warm Beige `.tst-attr` plinth (`margin-top: auto`). Auto-scroll on quote change: `scrollOptionIntoView()` — direct scrollTop/scrollLeft math on the list, never the page. Two-phase swap via `.tst-card.is-leaving` (140ms; reduced motion completes synchronously). DELETED across upgrade + polish: `.tst-qmark`, `.tst-railTitle`, `.tst-railQuote`, `.tst-railMeta`, `.tst-railDisc`, `.tst-railChip`, `.tst-railToggle*`, disclosure (`is-collapsed`/`mqMobile`), P6 rail pin/scroll, `.tst-dots`/`.tst-dot`. Kinetic hover (P6, kept): `.tst-cardInner` — visible card + MomentumHover mount.
- services.ts (home): `.sections-services`, `.parts-serviceCard(__inner)`
- main.ts: `.sections-hero` (home), `.sections-servicesHero`; page transitions via `page-transition.ts`
- Anchors: block `id` = nav `href="#id"`; heading `id="{id}-heading"` with `aria-labelledby` on the `<article>`.

## Header desktop nav state machine (2026-11-14, `decbricks.css` block "Fixed pill nav")

`.structure-navPill` (capsule) + the four `.parts-btnBlock` anchors inside it. CSS-only; `menu.ts` only syncs `router-link-active` + `aria-current="page"` after client-side swaps (unchanged). No scroll-driven header theme toggling exists — the capsule is a fixed light surface over whatever section passes beneath.

- **Capsule (self-sufficient surface):** Off-White `rgba(255,249,242,.92)` + `backdrop-blur(16px)`, full-opacity burgundy 1px hairline (`--color-darkPurple`), soft `0 2px 10px rgba(42,2,8,.10)` shadow. Edge ≥3:1 on every backdrop: fill-vs-backdrop 8.86 on burgundy, hairline-vs-backdrop 10.36 on Off-White (a low-alpha hairline measured 2.4:1 on sage — deviation from the brief's "low alpha" suggestion, required by measurement).
- **One rule per state via `--nav-*` vars** (`--nav-bg/--nav-fg/--nav-num/--nav-line/--nav-ring`) so background/label/numeral/underline cannot desync. The template utilities in Header.astro (`hover:bg-white`, `hover:text-darkPurple`, `focus:bg-white`, `duration-500`) are overridden by these unlayered rules — do not "fix" by editing the markup.
- **States:** default transparent + burgundy; hover Warm Beige fill; pressed darker beige (`color-mix 86% lightPurple / darkPurple`); focus-visible 2px burgundy ring offset 3px (ring always sits on the light capsule → 8.86:1, valid for all items incl. CONTACT); current `router-link-active` burgundy pill + Off-White label/numeral, **no underline** (ONE indicator); CONTACT CTA permanently dark — hover `--color-darkerPurple`, pressed `--color-darkestPurple`, never a light fill; CONTACT-current keeps the dark pill and is marked by the Off-White `::after` bar (`--nav-line`) — the only underline in the system.
- **Numerals:** `.parts-btnBlock__index` scoped inside the pill — 11px, tabular-nums, colour = `--nav-num` (≥6.86:1 in every state). The span exists only in Header.astro.
- **Motion:** 150ms `--ease-brand` on bg+colour; `prefers-reduced-motion: reduce` → 0ms. Underline space is reserved by the always-rendered `::after` (transparent unless CONTACT-current) — no layout shift.

## Remaining owner/placeholder items
`ServicesClients`, `TeamSection`, `ContactNumbers`, `FooterStatus` (all empty-safe/hidden until owner data arrives), `src/data/legal.ts` (`/terms` `TEMPLATE DRAFT`), and testimonial quote consent confirmation (`src/data/testimonials.ts`) — see `docs/open-items.md`.

## Brand typography layer (FONT-SWAP-PROMPT Option A, 2026-11-10)
- `src/lib/brand.ts` — `brandify(text)` (HTML-escape → wrap every `Decbricks` word in `<span class="font-brand">`). Use at RENDER points; data strings stay verbatim. (`BrandText.astro`, `BRAND` export, and unused `hasBrand` removed during cleanups.)
- `.font-brand` (decbricks.css) — FK Raster Roman Compact, 400, `text-transform:none`, `font-size:1.06em`, `line-height:1`, `white-space:nowrap`. 2026-11-11 owner decision: FK Raster ALSO carries the display/numeral role (`--font-offBit`/`--font-offBit101` → `.heading-2xl/3xl/3.5xl/4xl`, giant numerals); Departure Mono keeps only the small `--font-mono` role and is no longer preloaded (fallback-only).
- Type hooks (unchanged names, repointed values): `.font-neuePower`→Bricolage, `.font-nohemi`→Hanken, `.font-offBit`/`.font-offBit101`/`.font-mono`→Departure Mono. Semantic aliases `--font-heading/-body/-display/-brand/-mono` in `decbricks.css`.

### Brand inventory (every visible "Decbricks")
| Where | Treatment |
|---|---|
| Header wordmark | `<span class="font-brand …">Decbricks</span>` — 2026-11-12 `.font-brand` = **logo lockup** (`::before` logo + FK Raster name); sized 22/26px |
| Footer wordmark | Brick-laid `<div class="font-brand structure-footer__wordmark" translate="no">Decbricks</div>` (`clamp(62px, 22.8cqi, 424px)`, centered `0.30em × 0.275em` cream crest, `viewBox="0 0 96 48"` running-bond SVG fill via `background-clip: text`, stepped `clip-path` `.is-built` reveal) |
| Footer copyright | `brandify('© 2026 Decbricks. All rights reserved.')` with `translate="no"` on `.font-brand` lockup |
| Hero giant word(s) | `brandify(headingParts[*])` via `set:html` (~6% wider in Departure Mono — visual check §A) |
| Logo lockup | `.font-brand::before` = `/brand/logo.webp` via `--brand-logo-w/h` (**1.2em/1.1em**, aspect 1.088:1, mark v2 red blob); dark/coral contexts (`.structure-menu`, `.sections-servicesHero`, `.sections-contactForm`, `.structure-footer`) get the **cream variant** `/brand/logo-cream.webp` (owner decision 2026-11-12 — red mark fails 2.17:1 on burgundy, 1.22:1 on the coral footer band); opt-out `.font-brand--no-logo` (**zero opt-outs in use**); giant-context cap hook = set `--brand-logo-w/h` on a context class (none needed today: no giant brand contexts exist — hero H1s have no brand word); **header light state (2026-11-14):** `menu.ts` `applyLogoClasses()` toggles `.parts-animatedLogo--light` on the logo anchor when the lockup sits on a light surface (scrolled pill / open mobile menu / light page top) and `decbricks.css` swaps the header mark to flat red-fill `/brand/logo-red.webp` (owner request 2026-11-14; cream ≈1:1 there); both files share the trimmed box → zero CLS |
| Hero / smiley copy | `brandify(body/smileyCopy)` on sr-only + visual spans |
| ServicesHero | `brandify(srTitle, headingParts[0/1], body)` |
| AboutBlock | title h2, first/rest paragraphs, value names/texts, closing line |
| ContactBlock | title h2, h3 |
| TeamSection | member name/role/bio |
| ContactNumbers | labels + display strings |
| CalEmbed fallback | fallback title + help line |
| ContactForm | smiley copy (sr-only + visual) |
| contact.astro | "start a project" body |
| `scripts/smiley-text.ts` | GSAP SplitText `type:'lines', deepSlice:true` preserves nested `.font-brand` spans — no splitter change. If config ever becomes `chars`, brand-aware post-processing required. |
| NOT stylable (by rule) | `<title>`, meta/OG/Twitter, JSON-LD, `alt`, `aria-label`, mailto subjects |
| Gate | `npm run check:brand` (scripts/check-brand.py) must PASS before shipping |
