/**
 * Legal-page content (/terms, including Privacy Policy section) — open-items A11.
 *
 * TEMPLATE DRAFT: every company-specific fact is a bracketed placeholder.
 * Nothing here is presented as the owner's real legal position; the owner
 * replaces the placeholders and gets the text legally reviewed before the
 * page becomes indexable (see docs/open-items.md A11 and Design-handoff).
 *
 * Copy rules: plain professional English, typographic apostrophes, no bare
 * brand word in body copy (headings render through brandify() where needed).
 * The privacy section describes only what this site actually does today:
 * Formspree contact form, optional Cal.com booking, the cookie banner
 * (functional/essential + optional analytics), and standard server logs.
 */

export interface LegalSection {
  /** DOM id for aria-labelledby and anchor targets (slug-safe). */
  id: string;
  heading: string;
  body: string[];
  /** Optional bullet list rendered under the body paragraphs. */
  bullets?: string[];
}

export interface TermsDocument {
  slug: 'terms';
  title: string;
  seoTitle: string;
  seoDescription: string;
  /** Shown in the hero stamp; 'TEMPLATE DRAFT' until the owner supplies a date. */
  updated: string;
  intro: string;
  /** The two giant ServicesHero display words (FK Raster Compact). */
  heroHeading: readonly [string, string];
  sections: LegalSection[];
  privacy: {
    id: 'privacy-policy';
    heading: string;
    sections: LegalSection[];
  };
}

const CONTACT_LINE =
  'Questions about this document can be sent through the contact form on our website, or by email to [Contact email].';

const TERMS: LegalSection[] = [
  {
    id: 'acceptance',
    heading: '1. Acceptance of these terms',
    body: [
      'By accessing this website or engaging us for services, you agree to these Terms of Service. If you do not agree, please do not use the website or submit enquiries through it.',
      'These terms apply to the website and to any statement of work we both sign. Where a signed statement of work conflicts with these terms, the statement of work prevails for that engagement.',
    ],
  },
  {
    id: 'who-we-are',
    heading: '2. Who we are',
    body: [
      '“We”, “us” and “our” mean [Legal entity name], a company registered in [Jurisdiction] with its registered office at [Registered address], operating the website decbricks.com and providing the services described on it.',
    ],
  },
  {
    id: 'services',
    heading: '3. Services',
    body: [
      'We provide technology and digital services, currently including web and software development, AI and automation, strategy consulting, business development and outreach, design and branding, and digital marketing and growth. The exact scope, deliverables, timeline and price for any engagement are agreed in a written proposal or statement of work before work begins.',
      'Nothing on this website is a binding offer. Enquiries submitted through the contact form are requests to start a conversation, not orders.',
    ],
  },
  {
    id: 'payment',
    heading: '4. Quotes and payment',
    body: [
      'Prices are quoted per engagement and exclude taxes unless stated otherwise. Unless the statement of work says otherwise, an advance of [Advance percentage] is due before work starts and the remainder is due on delivery of agreed milestones.',
      'Invoices are payable within [Payment terms] days. Late payments may pause work and accrue interest at [Late interest rate] per month. Third-party costs (fonts, licences, hosting, media spend) are passed through at cost unless stated otherwise.',
    ],
  },
  {
    id: 'client-responsibilities',
    heading: '5. Your responsibilities',
    body: [
      'You confirm that content and materials you supply to us (copy, images, logos, data, access credentials) are yours to use, and that supplying them to us for the engagement does not infringe anyone’s rights.',
      'You agree to review deliverables and give feedback within [Review window] days, and to provide a single point of contact for approvals. Delays in feedback or materials may shift agreed timelines.',
    ],
  },
  {
    id: 'revisions',
    heading: '6. Revisions and timelines',
    body: [
      'Each deliverable includes [Number of revision rounds] rounds of revisions as described in the statement of work. Additional rounds or scope changes are quoted separately before they are carried out.',
    ],
  },
  {
    id: 'ip',
    heading: '7. Intellectual property',
    body: [
      'You own the final agreed deliverables (excluding our pre-existing tools, code libraries and know-how, and third-party licensed components, which remain with their owners) once payment for them is received in full. Until then, we retain ownership of the work in progress.',
      'We keep the right to reuse general skills, techniques and anonymised lessons learned, and — unless you ask us not to — to reference the engagement in our portfolio.',
      'Third-party material included in deliverables (fonts, stock media, open-source libraries) is licensed under its own terms; we will identify what we used on request.',
    ],
  },
  {
    id: 'confidentiality',
    heading: '8. Confidentiality',
    body: [
      'Each side keeps the other’s non-public information confidential and uses it only for the engagement, except where required by law or where the information is already public.',
    ],
  },
  {
    id: 'warranties',
    heading: '9. Warranties and disclaimers',
    body: [
      'We warrant that services are performed with reasonable skill and care. Beyond that, the website and services are provided “as is”, and we disclaim all other warranties to the extent permitted by law, including fitness for a particular purpose.',
      'We do not guarantee that the website will be uninterrupted or error-free, or that search rankings, ad performance or other third-party results will reach any particular level.',
    ],
  },
  {
    id: 'liability',
    heading: '10. Limitation of liability',
    body: [
      'To the extent permitted by law, our total liability for any claim connected to the website or an engagement is limited to the fees you paid us for the engagement giving rise to the claim. Neither side is liable for indirect or consequential loss, including lost profits or data.',
    ],
  },
  {
    id: 'termination',
    heading: '11. Termination',
    body: [
      'Either side may end an engagement with [Notice period] written notice. You pay for work performed and costs incurred up to the termination date; we hand over completed deliverables paid for to that point.',
      'We may suspend or terminate work immediately if payment is overdue or if you ask us to work with infringing or unlawful material.',
    ],
  },
  {
    id: 'governing-law',
    heading: '12. Governing law and disputes',
    body: [
      'These terms are governed by the laws of [Jurisdiction], and the courts of [Jurisdiction] have exclusive jurisdiction over disputes, after the parties first attempt to resolve the matter in good-faith discussion for [Dispute negotiation period] days.',
    ],
  },
  {
    id: 'changes',
    heading: '13. Changes to these terms',
    body: [
      'We may update these terms from time to time. The version published on this page applies from its stated effective date; for ongoing engagements, the version in force when the statement of work was signed applies to that engagement.',
    ],
  },
  {
    id: 'contact',
    heading: '14. Contact',
    body: [CONTACT_LINE],
  },
];

const PRIVACY: LegalSection[] = [
  {
    id: 'who-we-are-privacy',
    heading: '1. Who we are and how to reach us',
    body: [
      'This policy explains what personal data this website collects and why. “We”, “us” and “our” mean [Legal entity name], [Registered address], acting as the data controller for this website. [Contact email] is the address for privacy questions.',
    ],
  },
  {
    id: 'data-we-collect',
    heading: '2. Data we collect',
    // Paragraphical (owner request): the former bullet list lives on as one
    // paragraph per point, words verbatim.
    body: [
      'We collect only what the features below need:',
      'Contact form (name, email, company, message, and your consent to submit): sent through the form service Formspree (formspree.io), which delivers it as an email to our team inbox. The form service stores submissions and may apply spam checks to the data you send.',
      'Booking a call (when the booking widget is enabled): the scheduling service Cal.com processes the name, email and any details you enter to create the meeting.',
      'Cookies and similar storage: the cookie banner on this site lets you accept all, reject non-essential, or manage categories — functional/essential cookies (always on, required for the site to work) and optional analytics cookies (off unless you enable them).',
      'Server logs: our hosting records standard request data (page requested, approximate IP, timestamp, browser type) to operate and secure the site.',
    ],
  },
  {
    id: 'why-and-basis',
    heading: '3. Why we use it, and on what basis',
    body: [
      'Enquiry and booking data is used to respond to you and prepare proposals — the basis is taking steps at your request before a contract, and your consent where the form asks for it.',
      'Essential cookies and server logs are used to keep the site working and secure — legitimate interest. Optional analytics is used to understand how the site is used — only with your consent, which you can withdraw any time through the cookie banner’s “Manage Cookies” control.',
    ],
  },
  {
    id: 'sharing',
    heading: '4. Who we share it with',
    body: [
      'We share data only with the processors listed above (form delivery, scheduling, hosting, and — if you enable it — analytics), and with authorities where the law requires it. We do not sell personal data. The current processors and their regions are [Processor names and regions — confirm].',
    ],
  },
  {
    id: 'retention',
    heading: '5. How long we keep it',
    body: [
      'Enquiry emails and booking records are kept for [Retention period] so we can follow up and keep a history of our correspondence. Server logs are kept for [Log retention period]. Aggregated, non-identifying analytics data may be kept longer.',
    ],
  },
  {
    id: 'your-rights',
    heading: '6. Your rights',
    body: [
      'You can ask for a copy of your data, correction, deletion, restriction, portability, or object to particular uses, and withdraw consent (for example, analytics) at any time. Write to [Contact email] or use the contact form; we respond within [Response window] days. You also have the right to complain to your local data-protection authority — [Authority name and address].',
    ],
  },
  {
    id: 'international',
    heading: '7. International transfers',
    body: [
      'Our processors operate in [Processor regions]. Where data leaves your country, it is protected by [Transfer mechanism — confirm, e.g. standard contractual clauses].',
    ],
  },
  {
    id: 'security',
    heading: '8. Security',
    body: [
      'The site is served over HTTPS, form submission uses encrypted transport, and access to our inbox and booking dashboard is protected by [Security measures in place]. No online service is perfectly secure, so please do not send sensitive information (national IDs, payment card numbers, health data) through the contact form.',
    ],
  },
  {
    id: 'children',
    heading: '9. Children',
    body: [
      'This website is aimed at businesses and is not directed at children. We do not knowingly collect data from children; contact us if you believe a child has submitted data and we will delete it.',
    ],
  },
  {
    id: 'changes-privacy',
    heading: '10. Changes to this policy',
    body: [
      'We update this policy when our processing changes. The version on this page, with its stated date, is the current one.',
    ],
  },
  {
    id: 'contact-privacy',
    heading: '11. Contact',
    body: [CONTACT_LINE],
  },
];

export const TERMS_DOC: TermsDocument = {
  slug: 'terms',
  title: 'Terms of Service',
  seoTitle: 'Terms of Service | Decbricks',
  seoDescription:
    'The terms and privacy policy that govern the use of decbricks.com and our web, AI, design and growth services — template draft pending owner review.',
  updated: 'TEMPLATE DRAFT',
  intro:
    'These terms cover the use of this website, the services we provide through it, and how we handle personal data. The text is a template draft: bracketed placeholders mark the details the owner must supply before the page goes live.',
  heroHeading: ['Terms', 'Of Service'] as const,
  sections: TERMS,
  privacy: {
    id: 'privacy-policy',
    heading: 'Privacy Policy',
    sections: PRIVACY,
  },
};
