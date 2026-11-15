/**
 * Contact-page data. Missing values degrade to documented fallbacks
 * (see `docs/open-items.md` A2/A4/A7).
 */

export interface CalConfig {
  /** Cal.com link in `username/event-slug` form; '' = not configured. */
  link: string;
  /** Origin of the Cal.com deployment (app.cal.com for cloud). */
  origin: string;
  /** Fallback deep link opened in a new tab when the embed is unavailable. */
  bookingUrl: string;
  /** Shared Cal embed namespace across pages (inline + modal triggers). */
  namespace: string;
}

export const CAL: CalConfig = {
  link: import.meta.env.PUBLIC_CAL_LINK || 'decbricks-team/meet',
  origin: 'https://app.cal.com',
  bookingUrl: import.meta.env.PUBLIC_CAL_BOOKING_URL || 'https://cal.com/decbricks-team/meet',
  namespace: import.meta.env.PUBLIC_CAL_NAMESPACE || 'meet',
};

export const EMAIL = import.meta.env.PUBLIC_CONTACT_EMAIL || 'hello@decbricks.com';

/** Contact-form delivery endpoint (Web3Forms/Formspree/owner worker) — A7. */
export const CONTACT_ENDPOINT = import.meta.env.PUBLIC_CONTACT_ENDPOINT || '';

// Fail visibly in dev when the form cannot actually deliver anywhere, so the
// missing config is never mistaken for a working form. Prod stays silent —
// the runtime fallback (status message) handles it gracefully there.
if (import.meta.env.DEV && !CONTACT_ENDPOINT) {
  console.warn(
    '[decbricks] PUBLIC_CONTACT_ENDPOINT is not set — the contact form will not submit anywhere. See .env.example and docs/open-items.md A7.'
  );
}
