# Page card — `/services`

*Intent statements are assumptions until validated in Google Search Console.*

## Indexability
Indexable (after launch gate). Canonical `https://decbricks.com/services`. JSON-LD: CollectionPage
with 7 Service items + OfferCatalog, Organization, WebSite, BreadcrumbList — matches the 7 visible
blocks. 175 KB HTML (largest page; far under 2 MB). One H1.

## Target query & intent (assumption)
Commercial investigation across the seven service lines: "custom software development company india",
"ai automation agency", "mobile app development company", "brand identity design agency", "b2b lead
generation agency", "digital marketing agency for startups", "technology consulting for startups".
This single page carries all seven topics.

## First screen
Pass: "Our Expertise" hero with jump-nav to the seven blocks.

## Content the query needs that is missing
- **Depth per service.** One page with ~53 capabilities across 7 services cannot win specific,
  competitive queries like "ai agent development services". Per-service detail pages (or one strong
  flagship page per highest-priority service) are proposed in `03-architecture.md`/`04-content-plan.md`,
  gated on real scope, process and (where available) real project evidence per service.
- Process/how-we-work and scoping guidance (planned, no invented numbers).

## Internal links
- **In:** header/footer, home cards ×7, 404 recovery.
- **Out:** `/contact?service=<id>` ×7 (deep-linked enquiry), `/` , `/about` (+4 anchors), `/terms`, anchor nav ×7.

## Structured data that fits
CollectionPage + Service items (present, visible-content only). If per-service pages are built later,
each gets its own `Service` node — not before.

## Title & description options
1. **Our Services: Software, AI, Design & Digital Growth** / current meta — **recommended** (51/141 chars).
2. Software, AI Automation, Design & Outreach Services — Decbricks / same meta — alternative leading with service nouns for non-brand impressions.
3. Web, Mobile, AI & Growth Services — Decbricks / same meta — shorter alternative if truncation of option 2 is observed.
