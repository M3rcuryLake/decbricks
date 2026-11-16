# Content & SEO — Final Report

Owner decisions applied: see [verify-list.md](verify-list.md). Tagline: **Build Beyond Ordinary**. No `| Decbricks` suffix required on titles.

## What changed per page

| Page | Title (chars) | Meta (chars) | Other changes |
|---|---|---|---|
| `/` | Decbricks: Custom Software, AI, Design & Growth Studio (54) | 143 | New hero H1 + intro (no "award-winning" claim; none exists); `<h1>` now precedes headings, duplicate "Our Work" `<h2>` removed; Work intro copy tightened; logo alts now "<Company> logo"; logo ticker labelled "Where our builders have worked"; 7 service-card summaries rewritten so they no longer duplicate `/services` |
| `/about` | About Decbricks: Purpose, Values & Engineering Craft (52) | 145 | Verbatim opening sentence restored from `docs/about-section-data.md`; Chennai, India + links to `/services` and `/contact` added below the sections |
| `/services` | Custom Software, AI, Design & Digital Growth Services (53) | 141 | Meta/title only; service paragraphs and approved targets (10K+, 500+, 5K+) unchanged |
| `/contact` | Contact Decbricks — Book a Call or Start Your Project (53) | 141 | Hero intro no longer repeats the meta; links to `/services` and `/about` in the process text; `?service=<id>` now seeds the message field ("I'd like to discuss AI & Automation."); booking chip kept at "30 min or 1 hour" |
| `/terms` | Decbricks Terms of Service and DPDP Privacy Policy (50) | 142 | Only title, meta and H1 text changed; no clause edited; still `noindex`, not in sitemap |
| `/404` | Page Not Found — Explore Decbricks Services & Work (50) | 141 | Added "Contact Us" button and recovery copy; still `noindex` |
| Shared | — | — | `SITE.tagline`/`description` updated; `SITE.nav` flags corrected; `WebSite` + `Organization` JSON-LD on every indexable page, `Organization` now has Chennai/Tamil Nadu address and `areaServed`; canonical omitted on `noindex` pages; footer Services column now lists the 7 services; cookie banner links to the Privacy Policy |

## Verified
`npm run check` (0 errors), `build`, `headings`, `check:brand`, `links`, `check:footer`, `check:placeholders` all pass. All built pages parse their JSON-LD; sitemap lists 4 URLs. Playwright at 375 px and 1440 px: no horizontal overflow and no console errors on all six routes; `?service=` prefill confirmed. Note: screenshots were saved to the scratch folder but I checked them by metrics (overflow, errors), not by eye.

## Still open
- `[VERIFY]` none outstanding from the owner list. Cal.com event durations (15/25/40 min) differ from the "30 min or 1 hour" chip; align them in Cal settings (`open-items.md` A2).
- Service paragraph copy was left as supplied (T-3 tightening skipped to protect approved targets and verbatim source).
- Site is still `noindex` until `PUBLIC_ENV=production` is set.

## Google Search Console: what to observe
1. Add the property and verify (`PUBLIC_GSC_VERIFICATION` or DNS), then submit `https://decbricks.com/sitemap.xml`.
2. Use URL Inspection on `/`, `/about`, `/services`, `/contact` and note the indexing status and the canonical Google chose.
3. Watch the **Pages** report for excluded or "noindex" statuses (expected only for `/terms` and `/404`).
4. Watch **Performance** for the queries and pages that show impressions, and compare them with the hypotheses in [topic-map.md](topic-map.md).
