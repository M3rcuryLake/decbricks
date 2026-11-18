/**
 * Site-wide Decbricks configuration. Values that are not yet supplied by the
 * owner live here so they are only ever corrected in ONE place (see
 * docs/open-items.md §A).
 */

export interface NavLink {
  label: string;
  href: string;
  /** Anchor used by the pixel-transition for same-page jumps. */
  anchor?: string;
  /** Only link pages that actually exist — drives header/footer visibility. */
  enabled?: boolean;
}

/** Production origin. Override with PUBLIC_SITE_URL; confirmed in open-items A1. */
export const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL || 'https://decbricks.com';

export const SITE = {
  name: 'Decbricks',
  legalName: 'Decbricks',
  url: SITE_URL,
  tagline: 'Build Beyond Ordinary',
  description:
    'Decbricks builds custom software, AI automation, design and digital growth for startups and organisations in India and international markets.',
  /**
   * Default Open Graph / Twitter share card (1200×630 derived from
   * assets/brand/og-source.jpg). JPEG, not PNG: WhatsApp drops the thumbnail
   * for cards above roughly 300 KB, and the 63 KB JPEG is visually identical
   * to the 439 KB PNG while staying well inside that budget.
   * public/og-default.png is kept only for previews cached against the old URL.
   */
  ogImage: `${SITE_URL}/og-default.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/jpeg',
  ogImageAlt: 'Decbricks emblem and wordmark on a deep burgundy background',
  locale: 'en',
  themeColor: '#800020',
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || 'hello@decbricks.com',
  /** Social profile URLs (resolved open-items A8). */
  socials: [
    { label: 'X', href: 'https://x.com/decbricks' },
    { label: 'Instagram', href: 'https://www.instagram.com/decbricksofficial' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/decbricks/' },
  ] as Array<{ label: string; href: string }>,
  /** Main nav; pages are enabled as they are rebuilt (About+Contact exist from Phase 4/5). */
  nav: [
    { label: 'About', href: '/about', enabled: true },
    { label: 'Services', href: '/services', enabled: true },
    { label: 'Contact', href: '/contact', enabled: true },
  ] as NavLink[],
} as const;
