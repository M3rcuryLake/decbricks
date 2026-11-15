/**
 * Brand-name typographic treatment (FONT-SWAP-PROMPT §4).
 * Every VISIBLE "Decbricks" in copy renders in `.font-brand` (FK Raster).
 * Escape first so `set:html` output is safe for arbitrary strings, then
 * case-insensitively wrap the word, preserving its original casing.
 */

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

/** HTML-escaped text where every standalone `Decbricks` word is a `.font-brand` span
 *  (skipping domains like `decbricks.com`, emails `@decbricks.com`, and slugs `decbricks-team`). */
export function brandify(text: string): string {
  return escape(text).replace(
    /(?<![@./-])\bDecbricks\b(?!\.[a-z]{2,}\b|-[a-z])/gi,
    (m) => `<span class="font-brand">${m}</span>`
  );
}
