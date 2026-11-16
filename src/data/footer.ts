/**
 * Typed footer data (Footer redesign — Phase 1).
 * Unknown owner values stay empty (`EMAIL`, `CAL`, `SITE.socials`, legal pages)
 * and hide gracefully in the UI while emitting a dev-only console warning
 * (see `docs/open-items.md`).
 */
import { ABOUT } from './about';
import { CAL, EMAIL } from './contact';
import { SITE } from './site';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  enabled?: boolean;
}

export interface FooterColumn {
  id: string;
  heading: string;
  links: FooterLink[];
}

const COMPANY_IDS = new Set(['who-we-are', 'mission', 'vision', 'values']);
const companyLinks: FooterLink[] = ABOUT.filter((s) => COMPANY_IDS.has(s.id)).map((s) => ({
  label: s.navLabel,
  href: `/about#${s.id}`,
  enabled: true,
}));

export const FOOTER = {
  cta: {
    /** Existing verbatim copy from src/pages/contact.astro:91. */
    heading: 'Let’s Start Something Great.',
    /** PROPOSED label — owner can approve or adjust in open-items. */
    primary: { label: 'Start a project', href: '/contact' },
    /** PROPOSED label; rendered only when CAL.link or CAL.bookingUrl is configured (open-items A2). */
    bookingLabel: 'Book a call',
  },
  columns: [
    {
      id: 'pages',
      heading: 'Pages',
      links: [
        { label: 'Home', href: '/', enabled: true },
        { label: 'About', href: '/about', enabled: true },
        { label: 'Services', href: '/services', enabled: true },
        { label: 'Contact', href: '/contact', enabled: true },
      ],
    },
    {
      id: 'company',
      heading: 'Company',
      links: companyLinks,
    },
  ] as FooterColumn[],
  legal: [
    { label: 'Privacy', href: '/terms#privacy-policy', enabled: true },
    { label: 'Terms', href: '/terms', enabled: true },
  ] as FooterLink[],
  cookieLabel: 'Manage Cookies',
  copyright: '© 2026 Decbricks. All rights reserved.',
} as const;

export const FOOTER_CONTACT = {
  email: EMAIL,
  cal: CAL,
  socials: SITE.socials,
} as const;
