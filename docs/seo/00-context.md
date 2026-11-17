# Decbricks SEO Programme — Phase 0: Context & Assumptions

> Written 2026-11-17. Builds on the completed site build (`docs/PROGRESS.md`, Phases 0–8) and the completed
> content/copy pass (`docs/content-seo/`, tickets T-1…T-9 closed, owner decisions recorded in
> `docs/content-seo/verify-list.md`). This programme covers the wider SEO surface: technical foundations,
> rendering, architecture, on-page signals, content, structured data, AI-search readiness, performance,
> off-site planning and measurement. It does not redo the copy pass.

## Goal (assumed)

More qualified enquiries and booked calls from organic search. The primary conversion actions already
defined in `.agents/product-marketing.md` are: a Cal.com discovery call (`/contact` →
`cal.com/decbricks-team/meet`) and a project-brief form submission. No promises about rankings or traffic
are made anywhere in this programme; documents describe mechanisms and the metrics to observe.

## Product & positioning (source: `.agents/product-marketing.md` v1, 2026-11-15 — exists, not re-derived)

- **What:** Technology and digital solutions agency — web/software development, AI & automation, strategy
  consulting, design & branding, digital marketing & growth, and B2B outreach (seven services on `/services`).
- **Who:** Individuals, startups, businesses, organisations and student-led initiatives, in India and abroad.
- **Positioning:** One accountable partner spanning build *and* growth ("Complete digital solutions. One
  trusted partner."). Differentiators the repo supports: dual engineering + go-to-market competency,
  purpose-driven engineering, real campaign execution for Findtern / Upcoming Engineers / DevSummit / DSC SRM.
- **Tagline (owner, 2026-11-16):** "Build Beyond Ordinary". Titles do **not** carry a `| Decbricks` suffix
  requirement (V-8 decision) — current titles are topic-led per the copy pass.

## Stack, rendering & deploy facts (read from config only)

- **Astro ^5**, TypeScript, GSAP, Lenis, three.js. **Static rendering** (no adapter; `astro build` outputs
  `dist/`). `trailingSlash: 'never'`, `compressHTML: true`, `inlineStylesheets: 'auto'`.
- **Deploy target:** not visible in the repo (`_headers` file exists in `public/`, suggesting a
  static/CDN host such as Cloudflare Pages — **Needs verification**). `PUBLIC_ENV=production` flips
  indexing on (`Base.astro` + `robots.txt.ts`); until then every page ships `noindex, nofollow`.
- **Routes:** `/`, `/about`, `/services`, `/contact` (indexable), `/terms` (draft, `noindex, nofollow`),
  `/404` (`noindex, nofollow`), `/robots.txt` (generated), `/sitemap.xml` (generated, 4 URLs).
- **Client-side page swaps:** pages are swapped in the browser by `src/scripts/main.ts` /
  `page-transition.ts`; all meaningful HTML is still server-rendered in `dist/`.
- **Head & JSON-LD pipeline:** `src/layouts/Base.astro` (title/description/canonical/OG/Twitter/robots/GSC
  verification) + `src/lib/schema.ts` (Organization, WebSite, BreadcrumbList, AboutPage, ContactPage,
  CollectionPage with Service items).

## Markets

- **Primary:** India (organisation is Chennai-based — owner-approved publication, V-9). British/Indian
  English throughout; one English site serves India and international visitors.
- **Secondary:** international startup/SMB buyers evaluating remote engineering and growth partners.
- **No `hreflang`:** no separate language or country versions exist. Only if separate versions are built
  later should `hreflang` be added.

## Audience segments (from product-marketing + repo)

1. Founders / CEOs of early-stage startups (build an MVP or first product; speed and capital efficiency).
2. CTOs / tech leads of scaling companies (capacity, niche skills — AI agents, mobile, clean architecture).
3. Heads of growth / marketing at SMBs (pipeline, website, performance marketing, outreach engine).
4. Agencies needing a technical partner (white-label execution).
5. Student-led initiatives and communities (DevSummit, DSC SRM precedent).

## Query themes — hypotheses to validate in Google Search Console

All themes below are **hypotheses**, not observed demand. Validate each against the GSC Performance report
(impressions, queries, pages) after indexing flips on; retire or re-rank based on that data.

| # | Theme | Query shape (illustrative, not a target list) | Intent (assumed) | Best-fit page today |
|---|---|---|---|---|
| 1 | Branded / navigational | "decbricks", "decbricks chennai" | Navigational | `/` |
| 2 | Custom software development partner (India) | "custom software development company india" | Commercial investigation | `/services` |
| 3 | Web app / SaaS product engineering | "web app development agency for startups" | Commercial | `/services` |
| 4 | Mobile app development | "mobile app development company india" | Commercial | `/services` |
| 5 | AI agents & workflow automation | "ai automation agency", "ai agent development services" | Commercial | `/services` |
| 6 | AI chatbots for customer support/ops | "ai chatbot development for business" | Commercial | `/services` |
| 7 | Brand identity & UI/UX design | "brand identity design agency india" | Commercial | `/services` |
| 8 | Digital marketing for startups | "digital marketing agency for startups india" | Commercial | `/services` |
| 9 | B2B outbound / lead generation | "b2b lead generation agency india", "cold email outreach service" | Commercial | `/services` |
| 10 | Strategy / product consulting | "technology consulting for startups" | Commercial | `/services` |
| 11 | MVP development | "mvp development for startups" | Commercial | `/services` (gap — see 04) |
| 12 | Local / Chennai | "software development company chennai" | Commercial, local | `/` / `/about` |
| 13 | Dev + growth under one roof | "agency that does development and marketing" | Commercial | `/` |
| 14 | How agencies scope & price | "how much does it cost to build an app in india", "software agency pricing model" | Informational | Gap (content plan) |
| 15 | Vetting / due diligence | "decbricks review", "decbricks portfolio" | Informational / trust | `/` work section, `/about` |

## Working assumptions (proposals — correct any of these; the programme continues meanwhile)

The goal is more qualified enquiries and booked calls from organic search, with India as the primary market
and international startup/SMB buyers secondary. Search demand worth winning is commercial-investigation
demand around the seven service lines — software/web/mobile development, AI automation, design, digital
marketing and B2B outreach — plus brand queries. The site's main discoverability limit today is that it
ships `noindex` until `PUBLIC_ENV=production`, has only four indexable pages, and no per-service detail
pages; GSC data does not exist yet, so every query theme above is unvalidated. Enquiries arrive via Cal.com
or the form; consent-gated analytics would be needed to see which pages and queries drive them. Decbricks
has a real Chennai base (owner-approved) but no verified physical office address for Google Business
Profile. Competitor comparison, new-page creation and off-site work will be proposed, not executed, before
the review gate.

*(≈180 words)*
