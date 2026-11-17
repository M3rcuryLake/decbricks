# Decbricks — 05: Structured Data Plan

> Skill: schema. Principle: markup describes only what is visible on the same page; no
> `Review`/`AggregateRating` or any markup for absent content. Google's supported-feature gallery
> is checked before promising any rich result.

## Current state (verified in Phase 1/2)

One source of truth already exists: **`src/lib/schema.ts`** builds every node; pages pass the
result into `Base.astro`'s `schema` prop, which emits a single JSON-LD script. Emitted today:

| Page | Nodes | Verdict |
|---|---|---|
| `/` | Organization, WebSite | fits |
| `/about` | AboutPage, Organization, WebSite, BreadcrumbList | fits |
| `/services` | CollectionPage (mainEntity ItemList of 7 Service + OfferCatalog), Organization, WebSite, BreadcrumbList | fits; matches the 7 visible blocks |
| `/contact` | ContactPage, Organization, WebSite, BreadcrumbList | fits |
| `/terms`, `/404` | none | correct (noindex pages) |

## Recommended state

Keep exactly this shape. The one canonical builder (`src/lib/schema.ts`) stays the single source of
truth; any new page type gets a new exported function there rather than inline JSON in the page file.

### Organization (all indexable pages — unchanged, with two future additions)
- `name`, `url`, `logo`, `description`, `address` (Chennai/Tamil Nadu/IN), `areaServed`, `email`,
  `sameAs` = exactly the three owner-resolved profiles (`x.com/decbricks`,
  `instagram.com/decbricksofficial`, `linkedin.com/company/decbricks`). No profile is added to
  `sameAs` unless it really exists (rule already enforced by data, not markup).
- **Add when available:** `contactPoint` once a public phone number exists (open-items A3).
- **Optional, decision for review gate:** change the top-level type to `ProfessionalService`
  (adds services context for an agency) — only worthwhile if the owner wants local/service-class
  signals; `Organization` is correct and sufficient today. Default: no change.

### WebSite
- `name` + `url` only — correct. **No `SearchAction`**: the site has no search, and Google retired
  the sitelinks search box in November 2024. Do not add.

### BreadcrumbList
- Present on the three inner pages; matches URL hierarchy. If service detail pages are approved
  (03-architecture), each gets Home › Services › <Service> through the same `breadcrumbSchema`
  helper. No visible breadcrumbs (design language preserved).

### Service
- Only on `/services`, and only for the seven services visibly described there — already the case.
  Each per-service node carries `name`, `serviceType`, `description` (joined from the visible
  lead + paragraphs), `url` (`/services#id`), `provider`, and an `OfferCatalog` of the visible
  capabilities. When a dedicated `/services/ai-automation` page is built, its own `Service` node
  (same helper, page-scoped) replaces the fragment reference on that page — `/services` keeps the
  existing list only if the fragment blocks remain visible there.

### FAQ markup
- Only for FAQs visibly rendered on the page (e.g. the drafted AI page's "Common questions").
  **Expectation to set: no rich result** — Google stopped showing FAQ rich results for regular
  sites in May 2026. The markup's remaining value is machine-readability (AI assistants, agents),
  not a SERP feature. If that value isn't wanted, the FAQ still ships — as visible content only.

### Not used, and why
- `Review` / `AggregateRating`: no review content rendered as markup-eligible content on any page;
  testimonials exist as quotes but Google prohibits self-serving organisation review markup, and no
  third-party review profile exists. Never add without real third-party reviews.
- `LocalBusiness`: no verified street address (`[VERIFY]`); revisit if Google Business Profile is
  approved (07-offsite).
- `HowTo`: Google retired HowTo rich results (Sept 2023); the process section ships as visible
  content without markup unless a non-Google consumer is named.
- `Article`/`BlogPosting`: no blog yet.

## Validation discipline

- Every emitted node must match visible page copy (schema description ← same data file the page
  renders — already true via `site.ts`/`services.ts`).
- Post-build check: JSON-LD parses on every page (`npm run seo:check` in Phase 4 enforces),
  plus spot-checks in Google Rich Results Test for currently supported features after launch.
- `npm run check:footer` keeps Organization contact facts in parity with the rendered footer.
