# Decbricks — Phase 2: Rendered & Per-Page Audit

> Date: 2026-11-17. Method: `npm run build` → `npm run preview` → scripted Playwright run
> (Chromium) against `http://localhost:4321`, plus viewport/overflow checks and screenshots at
> 375 px and 1440 px (`docs/seo/screenshots/<page>-<width>.png`).
> **This local build is non-production** (`PUBLIC_ENV` unset), so every page correctly renders
> `noindex, nofollow` and robots.txt is `Disallow: /` — that is the launch gate (01-code-audit F-1),
> not a defect. Head tags were checked as if production by reading the code path in Phase 1.

## Source vs rendered — comparison

Everything meaningful in the head and body is identical between the built HTML and the rendered DOM:
Astro is fully static; the client-side swap (`src/scripts/main.ts`) replaces content only on
in-browser navigation and never injects or removes head tags. Measured differences between
`dist/index.html` (source) and the rendered DOM: none for title, meta description, canonical,
robots, OG tags or JSON-LD.

## Route-by-route results

| Route | HTTP | Title (rendered) | Meta desc | Canonical | Robots meta | JSON-LD (parses) | H1 count | Console errors |
|---|---|---|---|---|---|---|---|---|
| `/` | 200 | Decbricks: Build Beyond Ordinary — Software, AI & Growth | 143 chars | `https://decbricks.com/` | noindex, nofollow (gate) | ✅ Organization, WebSite | 1 | 0 |
| `/about` | 200 | About Decbricks: Purpose, Values & Engineering Craft | 145 chars | `https://decbricks.com/about` | noindex, nofollow (gate) | ✅ AboutPage, Organization, WebSite, BreadcrumbList | 1 | 0 |
| `/services` | 200 | Our Services: Software, AI, Design & Digital Growth | 141 chars | `https://decbricks.com/services` | noindex, nofollow (gate) | ✅ CollectionPage (+7 Service items), Organization, WebSite, BreadcrumbList | 1 | 0 |
| `/contact` | 200 | Contact Decbricks: Book a Call or Start Your Project | 141 chars | `https://decbricks.com/contact` | noindex, nofollow (gate) | ✅ ContactPage, Organization, WebSite, BreadcrumbList | 1 | 0 |
| `/terms` | 200 | Decbricks Terms of Service and DPDP Privacy Policy | 142 chars | — (suppressed by design) | noindex, nofollow (draft) | — (none by design) | 1 | 0 |
| `/404.html` | 200 (as file) | Page Not Found — Explore Decbricks Services & Work | 141 chars | — | noindex, nofollow | — | 1 | 0 |
| unknown path | **404** | (same 404 page) | | | | | | 1 expected "404 (Not Found)" resource error |

## Overflow & visual checks (375 px and 1440 px)

No horizontal overflow on any route at either width (`scrollWidth ≤ innerWidth` in all 14 checks).
Screenshots reviewed by eye: home first screen states what Decbricks does, for whom, with one
primary CTA (`Book a call`); contact first screen offers exactly two next steps (`Book a call`,
`Start a project`). The cookie banner overlays the lower right of the hero on `/` until dismissed —
dismissible by design, does not cover the CTA or nav.

## Internal links — all resolve

All internal `href`s collected from rendered DOM resolve to built pages or same-page anchors
(header/footer nav ×4 pages, 7 service anchors `#<id>`, `/contact?service=<id>` ×7, `/about#…`
anchors, `/terms`, `/terms#privacy-policy`, `mailto:hello@decbricks.com`, Cal.com deep link).
`npm run links` (repo checker) passes. **No broken or redirecting internal links found.**

## HTML size (2 MB crawler limit)

| Route | dist HTML | Verdict |
|---|---|---|
| `/services` | 174,660 B | pass |
| `/` | 131,706 B | pass |
| `/about` | 111,827 B | pass |
| `/terms` | 71,072 B | pass |
| `/contact` | 59,054 B | pass |
| `/404.html` | 20,469 B | pass |

All far under 2 MB; JSON-LD and links are never at risk of being cut off.

## Core Web Vitals — lab diagnostics

No Lighthouse or field-CWV tool is installed locally; lab numbers were therefore **not recorded**.
A Lighthouse run (via PageSpeed Insights or `npx lighthouse` against the deployed site) is listed
as an option in `docs/seo/08-measurement.md`. Known perf facts from the repo: render-blocking JS
~315 KB, three.js as a 556 KB deferred chunk, 3 font preloads + metric fallbacks, AVIF/WebP images
with explicit dimensions and fetchpriority on the first block image. **Lab numbers are not field
data; the only true CWV source will be the Search Console Core Web Vitals report after launch.**

## CRO-light findings (recorded; no redesign)

1. **Every page has exactly one clear next step** — pass: `/` (Book a call), `/services` (Discuss <service> per block), `/contact` (Book a call / Start a project). `/about` ends with links to `/services` and `/contact` (added in the copy pass).
2. **Booking reachable from every page** — pass: header (`Contact`), footer CTA, and on `/contact` itself. The hero CTA is a modal button when Cal is configured (F-8); its destination is still linked everywhere else.
3. **Contact form asks for no more than it needs** — pass: 4 fields (Email, Name, Company, Message) + one consent checkbox with Terms/Privacy links; honeypot only, no extra tracking.
4. **Home first screen answers "what is this and for whom"** — pass (screenshot-verified). The visual display type ("Build. Beyond…") is decorative; the accessible H1 carries the full sentence.
5. Minor: `/services` H1 renders "Our Services: Our Expertise" and `/about` H1 "About Decbricks: Our Purpose" — the `srTitle` + kicker composition reads duplicated to humans inspecting the DOM (visually it is a styled kicker + display heading, which is the template's design language — not a redesign item, but noted as a copy-polish candidate).
