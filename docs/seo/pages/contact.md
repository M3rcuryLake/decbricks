# Page card — `/contact`

*Intent statements are assumptions until validated in Google Search Console.*

## Indexability
Indexable (after launch gate). Canonical `https://decbricks.com/contact`. JSON-LD: ContactPage,
Organization, WebSite, BreadcrumbList. 59 KB HTML. One H1 ("Contact Decbricks"; visual display
"Talk With Us…" is decorative). `/contact?service=<id>` variants are not separately indexable
(no canonical variety needed — the query param seeds the form only; canonical stays `/contact`).

## Target query & intent (assumption)
Transactional: "contact decbricks", "hire software agency india", "book a call web development agency";
plus on-site arrivals from service blocks with a chosen service (`?service=` prefill works — copy-pass feature, verified in `docs/content-seo/final-report.md`).

## First screen
Pass: "Talk with us…" + exactly two equal CTAs (Book a call / Start a project) — screenshot-verified at 375 px.

## Content the query needs that is missing
- A visible human phone number / WhatsApp: `PHONES` data is empty by design (graceful-hidden; open-items A3) — `[VERIFY]` owner item; never invent.
- Response-time expectation is present ("5–8 days review" etc. from `legal.ts`) — adequate.

## Internal links
- **In:** header pill, footer CTA, `/services?service=` links ×7, `/about`.
- **Out:** `/` (+4 anchors), `/services`, `/about`, `/terms`, Cal.com deep link, mailto.

## Structured data that fits
ContactPage + Organization (present). `Organization.contactPoint` appears only when phones exist.

## Title & description options
1. **Contact Decbricks: Book a Call or Start Your Project** / current meta — **recommended** (53/141 chars).
2. Book a Discovery Call — Decbricks Software & AI Team / same meta — alternative if call-booking dominates form submissions in observed behaviour.
3. Contact Decbricks — Software, AI & Growth Enquiries / same meta — neutral alternative.
