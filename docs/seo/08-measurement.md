# Decbricks — 08: Measurement Plan (proposal only — no tracking code before approval)

> Skills: analytics, conversion-tracking. Constraints: nothing fires before consent; the contact
> form, Formspree, Cal.com and booking behaviour stay unchanged; no tracking exists on the site
> today (verified in Phase 1). This document is a plan for the owner to approve and execute.

## A. Google Search Console (owner steps; no site-code consent issues — GSC verification meta is already wired)

1. **Verify the domain.** Two paths: (a) `PUBLIC_GSC_VERIFICATION` build variable → the meta tag
   ships via `Base.astro` (URL-prefix property); or (b) DNS TXT record for the **domain property**
   `decbricks.com` (covers http/https/www automatically). DNS is the more robust choice.
2. **Submit the sitemap:** after `PUBLIC_ENV=production` flips indexing on, submit
   `https://decbricks.com/sitemap.xml` under Sitemaps.
3. **URL Inspection** on `/`, `/about`, `/services`, `/contact`: confirm "URL is on Google" status,
   the canonical Google chose, and that the user-declared canonical matches.
4. **Watch (observation, not expectation):**
   - **Pages report:** indexed vs excluded; the only acceptable exclusions are `/terms` (draft)
     and 404s.
   - **Performance report:** validate the query themes in `00-context.md`; log impressions,
     queries and pages in a monthly note. This is what confirms or kills the topic hypotheses.
   - **Core Web Vitals report:** the only field-data source for CWV (no lab score is field data).
   - **Links report:** baseline referring domains before any off-site work.

## B. Analytics tool choice (decision for owner)

| Option | Cost | Consent story | Notes |
|---|---|---|---|
| **GA4 (recommended default)** | Free | Google Consent Mode v2: `analytics_storage` denied until the cookie banner grants it; the existing banner (`cookies.ts`) already stores essential/analytics consent and emits `cookies-decided` | Native pairing with GSC; async-loaded, no first-paint impact |
| Plausible / Fable | Paid | Script loads only after analytics consent | Simpler reports; no ad-platform plumbing |
| None | — | — | Leaves enquiries unattributable to pages/queries; not recommended once traffic exists |

GA4 respects the existing banner: the tag should be blocked until the banner's analytics consent
exists (same gate the Cal embed already uses via `cookies-decided`). Visitors who decline are
uncounted by design; that is correct, not a loss to "recover".

## C. Event plan (names, triggers, properties) — all consent-gated

| Event | Trigger point (existing code hook) | Properties | Counts as |
|---|---|---|---|
| `contact_form_submitted` | **Confirmed success only** — the existing success branch in `src/scripts/contact.ts` (status message render), never the submit click | `form_location`, `service` (from `?service=`) | Primary conversion |
| `booking_started` | `Cal('inline')` successful mount / calendar interaction in `src/scripts/cal-embed.ts` | `placement` (`contact`, `modal`) | High-intent signal (Secondary) |
| `booking_completed` | existing `bookingSuccessful` handler in `cal-embed.ts` | `placement` | Primary conversion |
| `cta_clicked` | Primary CTAs: hero Book a call, contact Book a call/Start a project, service Discuss links | `cta_id`, `page` | Secondary (navigation signal) |

Rules from the conversion-tracking method: fire on confirmed success, never on attempt (the
success branch already distinguishes real submissions); a tag firing ≠ conversion arriving —
verify one test form submission and one test booking actually appear in GA4 DebugView before
calling it done; ad-platform pixels (Google Ads/Meta) are a later decision, only if paid search
launches (product-marketing lists a pilot budget), and they would reuse the same confirmed-success
hooks, not new ones.

## D. UTM & AI-referral hygiene (when sharing links)

- Lowercase UTMs, hyphen-separated: `utm_source=linkedin&utm_medium=social&utm_campaign=launch-2026`.
- Add a GA4 channel-group rule for assistant referrers (`chatgpt.com`, `perplexity.ai`) into an
  "AI assistants" channel; treat it as a floor (assistant visits often arrive direct/branded).

## E. What this plan deliberately does not do

No email/name/PII in event properties · no tracking before the banner grants analytics consent ·
no changes to Formspree payloads or Cal behaviour (events hook alongside existing handlers) ·
no server-side sending unless/when ad platforms need it (browser-side + GA4 is sufficient for
a consented analytics programme).
