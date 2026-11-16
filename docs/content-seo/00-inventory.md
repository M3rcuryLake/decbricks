# Content & SEO Inventory — Decbricks

## 1. Routes, Layouts, Shared Copy & Content Sources

### Routes (`src/pages/`)
- `/` — `src/pages/index.astro` (home page)
- `/about` — `src/pages/about.astro` (company purpose, mission, vision, values, experience, philosophy)
- `/services` — `src/pages/services.astro` (7 service blocks & capabilities)
- `/contact` — `src/pages/contact.astro` (Cal.com booking, project process, contact form)
- `/terms` — `src/pages/terms.astro` (unified Terms of Service & Privacy Policy; `noindex, nofollow`)
- `/404` — `src/pages/404.astro` (error fallback; `noindex, nofollow`)
- `/robots.txt` — `src/pages/robots.txt.ts` (`Allow: /` + `Sitemap:` when `PUBLIC_ENV === 'production'`, else `Disallow: /`)
- `/sitemap.xml` — `src/pages/sitemap.xml.ts` (lists `/`, `/about`, `/services`, `/contact` with build-date `<lastmod>`)

### Layout & Shared Components Holding Hardcoded Copy
- `src/layouts/Base.astro` — default `<title>` (`${SITE.name} | ${SITE.tagline}`), default `<meta name="description">`, skip link (`Skip to main content`), canonical, robots (`noindex, nofollow` unless `PUBLIC_ENV === 'production'`), OG (`og:type`, `og:site_name`, `og:locale`, `og:url`, `og:title`, `og:description`, `og:image`, width/height/alt), Twitter (`summary_large_image`), `PUBLIC_GSC_VERIFICATION`, JSON-LD `<slot>`/`schema` prop.
- `src/components/Header.astro` — `Decbricks` logo `aria-label`, nav links (`01 Work`, `02 About`, `03 Services`, `04 Contact`), mobile `Menu` / `Close` / `Esc to close` labels.
- `src/components/Footer.astro` + `src/components/footer/*` — `FooterCta.astro`, `FooterNav.astro`, `FooterContact.astro` (`Reach us`, `Copy`, social links), `FooterWordmark.astro`, `FooterLegal.astro` (`Rise to the top`, `Manage Cookies`, copyright).
- `src/components/ContactForm.astro` — default `smileyCopy`, hidden `srHeading` (`Begin your story`), giant display words (`Begin your` / `story`), `Get In Touch`, field placeholders/labels (`Email`, `Name`, `Company`, `Message`), `_subject`, Terms/Privacy checkbox text, `Submit`.
- `src/components/Hero.astro` — home hero H1/H2, `"Book a call"`, `"Scroll To Explore"`, showreel `aria-label` & description, `"Find Out More"` CTA on 7 service cards.
- `src/components/CaseStudies.astro` — `"Our Work"`, smiley subheading, intro paragraph, slider a11y instructions.
- `src/components/Testimonials.astro` — `"/// Client words"`, `"What our clients say"`, prev/next/rail `aria-label`s.
- `src/components/ServicesHero.astro` — `"Jump to"` label + default hero props from `SERVICES_HERO`.
- `src/components/ServiceBlock.astro` — `"{number} / 07"`, `"Discuss {navLabel} ->"`.
- `src/components/AboutBlock.astro`, `src/components/ContactBlock.astro` — section eyebrows, headings, body rendering.
- `src/components/CalEmbed.astro` — fallback copy (`"Online booking is coming soon."`, `"The booking calendar could not load here."`, `"Book a call on Cal.com"`, `"Email us"`, `"Or send the form below — we read every message."`).
- `src/components/CookieBanner.astro` — cookie notice, `Functional` / `Analytics` descriptions, `Accept All` / `Manage` / `Delete All` / `Save`.
- `src/components/Loader.astro` — `"Hold Tight"`, `"Almost Ready"`.
- `src/components/LegalPage.astro` — `"Last Updated: ..."`, `"Back to top"`.

### Content Sources
- `src/data/site.ts` — `SITE`, `SITE_URL`, `socials`, `nav` (note: `SITE.nav` has `About`/`Contact` `enabled: false`, unused by `Header.astro`).
- `src/data/about.ts` — `ABOUT` (7 sections, derived from `docs/about-section-data.md`).
- `src/data/services.ts` — `SERVICES_SECTION_HEADER`, `SERVICES_HERO`, `SERVICES` (7 services, derived from `docs/services-content.md` plus expanded paragraphs).
- `src/data/projects.ts` — `PROJECTS` (4 posters: Findtern, Upcoming Engineer, Hackcelerate ’27, Developer Students Club).
- `src/data/company-logos.ts` — `COMPANY_LOGOS` (12 badges).
- `src/data/testimonials.ts` — `TESTIMONIALS` (6 entries, `placeholder: false, consent: true`).
- `src/data/contact.ts` — `CAL`, `EMAIL`, `CONTACT_ENDPOINT`.
- `src/data/footer.ts` — `FOOTER`, `FOOTER_CONTACT`.
- `src/data/legal.ts` — `TERMS_DOC` (from `docs/decbricks-legal.docx`).
- `src/lib/schema.ts` — `organizationSchema`, `webSiteSchema`, `aboutPageSchema`, `contactPageSchema`, `servicesPageSchema`.

---

## 2. Page-by-Page Inventory (Verified Against `dist/` Build)

| URL | File | Purpose | Main Audience | Current `<title>` | Current Meta Description | Current H1 | Word Count (visible / content-only) | Internal Links (In / Out) | Claims Needing Proof |
|---|---|---|---|---|---|---|---|---|---|
| `/` | `src/pages/index.astro` | Primary studio landing page: positioning, 7 service cards, work posters, client logos, testimonials, enquiry form. | Founders, startups, businesses, and student-led initiatives looking for tech, design, or growth partners. | `Decbricks \| Building Technology. Empowering Businesses. Driving Growth.` (71 chars) | `Decbricks is a technology and digital solutions agency helping businesses innovate through software development, AI, automation, design and business growth services.` (165 chars) | `Technology, creative & growth agency. Software builders, brand shapers & business growth partners.` (`sr-only`; visual `Build. Beyond` is `<h2>` + `<span>`) | 579 total / 466 content-only | **In:** Header logo/Work, Footer Pages, 404 Back to Home. **Out:** `/about` (+4 anchors), `/services` (+7 anchors), `/contact`, `/terms`, `/terms#privacy-policy`. | Relationship to 12 `COMPANY_LOGOS` (Barclays, EY, TCS, Zoho, Chargebee, FourKites, Turing, Sparq, Vedricx, Logout Spells) unstated; 6 testimonials (`Tata Steel`, `Amgen`, `Nokia`, `Mittal Constructions`, `Jajodia Hardware`, `Goyal Timber`) carry generic `"Professional"` titles & placeholder-comment residue; 4 project posters have no scope/outcome; service target numbers (`10K+`, `500+`, `5K+`). ("Award-winning" not present.) |
| `/about` | `src/pages/about.astro` | Explain Decbricks' purpose, values, experience, and engineering philosophy. | Prospective clients evaluating trust, mindset, and capability breadth across India and abroad. | `Our Purpose \| Digital & Technology Solutions Agency` (51 chars; missing `Decbricks`) | `Discover Decbricks, a technology and digital solutions agency helping businesses innovate through software development, AI, automation, design and business growth services.` (172 chars) | `Our Purpose` (`sr-only`) | 1105 total / 974 content-only | **In:** Header, Footer Pages + Company anchors. **Out:** `/`, `/services`, `/contact`, `/terms`, `/terms#privacy-policy`, 7 `#section` jumps. (Zero links in About prose to `/services` or `/contact`.) | Outreach claims for Findtern & Upcoming Engineers; Vision poster third-party credit (`"POSTER BY ZEKA DESIGN"`, `open-items.md` B4). Note: `about.ts` omits sentence 1 of `docs/about-section-data.md`. |
| `/services` | `src/pages/services.astro` | Detail all 7 service lines and 53 sub-capabilities, driving project enquiries. | Buyers comparing specific technical, creative, AI, marketing, or outreach capabilities. | `Our Expertise & Services \| Decbricks` (36 chars) | `Explore Decbricks services: strategy & consulting, design & branding, web & software development, mobile apps, AI automation, digital marketing and outreach.` (157 chars) | `Our Expertise` (`sr-only`) | 953 total / 823 content-only | **In:** Header, Footer Pages, Home `#services` cards (×7), 404 button. **Out:** `/contact?service=*` (×7), `/`, `/about` (+4 anchors), `/terms`, 7 `#service` jumps. | Findtern `"targeting 10K+ potential student and recruiter visits"`, Upcoming Engineers `"500+ engineering resources"`, DevSummit & DSC SRM `"designed to reach 5K+ students"`, `"Meta ads campaigns"` — verify whether achieved metrics or scope wording is preferred. |
| `/contact` | `src/pages/contact.astro` | Convert high-intent visitors via Cal.com call booking, project process clarity, or form submission. | Qualified prospects ready to book a discovery call or send a brief. | `Contact Decbricks \| Start Your Digital Project` (46 chars) | `Contact Decbricks for website development, app development, AI automation, custom software, digital marketing and business outreach services.` (141 chars) | `Contact Decbricks` (`sr-only`; visual `Talk With Us...`) | 549 total / 430 content-only | **In:** Header pill, Footer CTA/Pages, `/services` card CTAs (`?service=`). **Out:** `/`, `/about` (+4 anchors), `/services`, `/terms`, `#book-a-call`, `#start-a-project`. (No body links to `/services` or `/about`.) | Booking chip `"30 min or 1 hour"` conflicts with Cal.com config note (`15m / 25m / 40m` in `open-items.md` A2). `"5-8 days"` review & `"2-3 revision rounds"` match `legal.ts`. |
| `/terms` | `src/pages/terms.astro` | Legal Terms of Service and Privacy Policy (`noindex, nofollow` draft state). | Clients, prospects, and compliance reviewers checking contract & DPDP Act privacy terms. | `Terms of Service & Privacy Policy \| Decbricks` (45 chars) | `Terms of Service and Privacy Policy governing your access to and use of the Decbricks website (decbricks.com), services and digital solutions.` (142 chars) | `Terms of Service` (`sr-only`; Privacy Policy is `<h2>`) | 3591 total / 3486 content-only | **In:** Footer legal, ContactForm checkbox label. **Out:** `/`, `/about` (+4 anchors), `/services`, `/contact`. | Legal copy is verbatim owner source (`docs/decbricks-legal.docx`); do not edit body text. Only `<title>`, meta description, and heading structure are in scope. |
| `/404` | `src/pages/404.astro` | Catch mistyped or removed URLs and route visitors back to core pages (`noindex, nofollow`). | Lost visitors landing on broken URLs. | `404 - Page Not Found \| Decbricks` (32 chars) | `The page you are looking for could not be found.` (48 chars) | `404` | 78 total / 28 content-only | **In:** Static server 404 fallback. **Out:** `/`, `/services`, Header & Footer links. | None. |

---

## 3. Working Assumptions Proposal

Decbricks speaks to founders, small and mid-sized businesses, agencies, and student-led technical initiatives in India and abroad who need one accountable partner to plan, design, build, automate, and grow digital products. Visitors arrive wanting clear answers on what Decbricks builds, how engagements work, and whether the team can ship reliably without vendor handoffs.

Our voice is warm, plain, confident, and specific: short active sentences, British/Indian English spelling (`organisation`, `customised`), concrete deliverables before abstract promises, and zero agency jargon or unverified hype.

Each page drives one primary action:
- **Home (`/`):** Understand what Decbricks does and book a discovery call (or jump straight to a relevant service).
- **About (`/about`):** Trust how Decbricks thinks and works, then move to Services or Contact.
- **Services (`/services`):** Match a business need to one of the seven services and start an enquiry for that service.
- **Contact (`/contact`):** Book a 15–40 minute Google Meet call on Cal.com or submit the project enquiry form.
- **Terms (`/terms`):** Review contract and privacy terms clearly without friction.
- **404 (`/404`):** Recover cleanly to Home, Services, or Contact.
