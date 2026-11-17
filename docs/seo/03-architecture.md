# Decbricks — 03: Site Architecture

> Skill: site-architecture. Every recommendation names its evidence or is labelled a hypothesis.
> Constraints: preserve the template's design language (no visible redesign), `trailingSlash: 'never'`,
> one H1 per page, no invented facts.

## Current page tree (verified)

```
Home (/)
├── About (/about)
├── Services (/services)  ← single page, 7 in-page blocks (#strategy-consulting … #business-development-outreach)
├── Contact (/contact)    ← Cal.com booking + enquiry form + process copy
├── Terms (/terms)        ← noindex draft (Terms + Privacy Policy)
├── 404 (/404 → dist/404.html) ← noindex
├── /robots.txt (generated) · /sitemap.xml (generated, 4 URLs)
```

Navigation today: header = Work (`/#work` scroll), About, Services, Contact; footer = Pages (4),
Company (About anchors), Services (7 `#<id>` links, added in the copy pass), Contact CTA, legal.
Header nav is 4 items — within the 4–7 best-practice band; no dropdown needed.

## Recommended tree (18–90 days, gated)

Proposed only where a **distinct topic + intent, unique value, and a real source of facts** exist.
Nothing below is built before the review gate approves it.

```
Home (/)
├── About (/about)                          [exists]
├── Services (/services)                    [exists — hub]
│   └── Service detail pages (/services/<service-id>)   [PROPOSED — only for the 1–3 services
│        Decbricks can back with real scope, process and (where available) real project evidence;
│        highest-value candidate: /services/ai-automation. No page without that evidence.]
├── Work (/work)                            [PROPOSED — only if ≥2 real case-study pages exist;
│   └── Case studies (/work/<project>)      otherwise keep home #work section as the hub]
├── Process (/about#process or /services anchor)         [PROPOSED — "how we scope and price"
│        using only facts already in src/data/legal.ts: 5–8 day proposal review, 2–3 revision
│        rounds, 14 days post-launch support. Could be a section before a standalone page.]
├── Contact (/contact)                      [exists]
├── Terms (/terms)                          [exists, noindex]
└── 404                                     [exists]
```

A blog is **not** proposed for the first 90 days: four indexable pages have no GSC baseline yet,
and thin/early content would dilute the site's only strong pages (agrees with the previous plan's
"What not to do now"). Decision guides (04-content-plan) revisit this with GSC data.

## URL conventions

- Non-trailing-slash, lowercase, hyphenated (`/services/ai-automation`) — matches `trailingSlash: 'never'`
  and the existing canonical policy (`Base.astro` + `astro.config`).
- `?service=<id>` on `/contact` is a form-seeding parameter, not a content URL — canonical stays
  `/contact`; never create indexable variants of it.
- New slugs reuse existing service IDs verbatim (`strategy-consulting`, `design-branding`,
  `web-software-development`, `mobile-app-development`, `ai-automation`,
  `digital-marketing-growth`, `business-development-outreach`) so anchors, footer links and
  JSON-LD keep one vocabulary.

## Navigation & footer links

- Keep the 4-item header as-is (design language). If `/work` and service detail pages are approved,
  **Work** and **Services** keep their current hrefs (`/#work`, `/services`); detail pages are
  reached from context, not the header.
- Footer Services column already lists all 7 — when detail pages exist, these links point at
  `/services/<id>` instead of `/services#<id>` (one-line data change in `src/data/footer.ts`).

## Breadcrumbs

`BreadcrumbList` JSON-LD already exists on `/about`, `/services`, `/contact` (`src/lib/schema.ts`).
Visible breadcrumbs would deviate from the template's design language — **not recommended**;
the JSON-LD layer stays. If service detail pages are built, their `BreadcrumbList` becomes
Home › Services › <Service> via the same helper.

## Internal-linking map

| From | To | Anchor style | Status |
|---|---|---|---|
| `/services` (hub) → each service detail page | `/services/<id>` | "Discuss <service>" style CTA per block | after pages exist |
| Service detail page → `/services` hub | breadcrumb trail + closing link | "All services" | after pages exist |
| Home `#work` section → each case study | `/work/<project>` | project name (not "learn more") | after case studies exist |
| `/about` → process section | `/services` or `/about#…` | "How we scope and price" | after section exists |
| Every service page → `/contact?service=<id>` | enquiry deep-link (existing pattern) | "Start a <service> project" | after pages exist |
| Case study → its service page | `/services/<id>` | service name | after both exist |

No orphan pages: every proposed page is reachable from header, footer or a contextual link on the
day it ships (checked by `npm run links`, later `npm run seo:check`).
