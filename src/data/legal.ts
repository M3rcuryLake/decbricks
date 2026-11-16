/**
 * Legal-page content (/terms, including Privacy Policy section) — open-items A11.
 *
 * Word-for-word from `docs/decbricks-legal.docx` (Last Updated: 16th November, 2026).
 * Only `intro` (`ServicesHero.astro`) and the opening Terms `preamble` in
 * `LegalPage.astro` use `brandify()`; all Terms and Privacy Policy clauses and
 * the Privacy preamble render as plain body text.
 */

export interface LegalSection {
  /** DOM id for aria-labelledby and anchor targets (slug-safe). */
  id: string;
  heading: string;
  body: string[];
  /** Optional bullet list rendered under the opening body paragraphs. */
  bullets?: string[];
  /** Optional closing paragraphs rendered after the bullet list. */
  afterBullets?: string[];
}

export interface TermsDocument {
  slug: 'terms';
  title: string;
  seoTitle: string;
  seoDescription: string;
  /** Shown in the hero stamp (`Last Updated: {updated}`). */
  updated: string;
  intro: string;
  /** Opening paragraph(s) rendered at the top of the Terms reading box before Section 1. */
  preamble: string[];
  /** The two giant ServicesHero display words (FK Raster Compact). */
  heroHeading: readonly [string, string];
  sections: LegalSection[];
  privacy: {
    id: 'privacy-policy';
    heading: string;
    updated: string;
    preamble: string[];
    sections: LegalSection[];
  };
}

const TERMS: LegalSection[] = [
  {
    "id": "about-decbricks",
    "heading": "1. About Decbricks",
    "body": [
      "\"Decbricks\", \"we\", \"us\" and \"our\" mean the founders of Decbricks, based in Chennai, India, who operate the website decbricks.com.",
      "We provide technology-driven services and digital solutions, including:"
    ],
    "bullets": [
      "Website design and development",
      "Web application development",
      "UI/UX design",
      "Digital strategy and consulting",
      "Branding and creative solutions",
      "Technology and business support services",
      "Other customised digital solutions agreed upon with clients"
    ],
    "afterBullets": [
      "We work with individuals, startups, businesses and organisations, in India and abroad, to develop solutions suited to their requirements."
    ]
  },
  {
    "id": "scope-of-services",
    "heading": "2. Scope of Services",
    "body": [
      "The specific services, deliverables, timelines and pricing will be agreed in a written proposal or statement of work before a project begins. These Terms apply to the website and to every statement of work we both sign. If a signed statement of work conflicts with these Terms, the statement of work prevails for that engagement.",
      "Nothing on this website is a binding offer. Enquiries submitted through the contact form or the booking widget are requests to start a conversation, not orders.",
      "Any additional requirements or changes requested after a project has started may result in revised timelines, deliverables or costs, which we will quote before carrying them out.",
      "Decbricks reserves the right to modify its service offerings based on business requirements and operational capabilities."
    ]
  },
  {
    "id": "client-responsibilities",
    "heading": "3. Client Responsibilities",
    "body": [
      "Clients agree to:"
    ],
    "bullets": [
      "Provide accurate project information and requirements.",
      "Supply necessary content, materials, credentials and resources on time.",
      "Ensure that all materials provided to Decbricks (copy, images, logos, data, access credentials) are legally authorised for use, and that supplying them for the project does not infringe anyone's rights.",
      "Review deliverables and respond to requests for feedback, approvals and clarifications within the review period stated in the proposal (usually 5–8 days, or 7 days if none is stated). If we receive no response by the end of that period, we may treat the stage as approved and proceed.",
      "Nominate a single point of contact for approvals.",
      "Avoid using our services for unlawful, misleading or unauthorised activities."
    ],
    "afterBullets": [
      "Delays caused by incomplete information, delayed feedback or approvals, or unavailable resources may shift agreed timelines.",
      "Clients are responsible for, and will indemnify Decbricks against, third-party claims arising from the materials they supply for a project."
    ]
  },
  {
    "id": "payments-and-pricing",
    "heading": "4. Payments and Pricing",
    "body": [
      "Project pricing, payment schedules and milestones will be communicated and agreed before work begins. Prices exclude applicable taxes unless stated otherwise.",
      "Unless otherwise agreed in writing:"
    ],
    "bullets": [
      "An advance of 50% is due before work starts, and the remainder is due on delivery of the agreed milestones.",
      "Invoices are payable within 7 days.",
      "Late payments may pause project activities and may accrue interest at 1.5% per month.",
      "Third-party costs (such as fonts, licences, hosting and media spend) are passed through at cost.",
      "Work outside the original scope may be charged separately.",
      "Any applicable taxes or transaction charges will be communicated where relevant."
    ],
    "afterBullets": [
      "Specific payment and refund conditions may be included in individual project agreements or proposals."
    ]
  },
  {
    "id": "project-execution-and-collaborations",
    "heading": "5. Project Execution and Collaborations",
    "body": [
      "Decbricks works with a network of developers, designers, creative professionals and other independent contributors to deliver project requirements.",
      "Depending on project complexity, workload, timelines and specialised requirements, Decbricks may engage or invite external agencies, freelancers or individuals, including collaborators based outside India, to assist with specific aspects of a project.",
      "Decbricks remains responsible for coordinating the agreed scope of work and expects all collaborators to follow applicable confidentiality, security and project-related requirements. Decbricks is responsible for the work of its collaborators as for its own, and obtains written confidentiality and intellectual-property assignments from each of them.",
      "Portfolio projects shown on the website were delivered by Decbricks and its collaborators."
    ]
  },
  {
    "id": "revisions-and-changes",
    "heading": "6. Revisions and Changes",
    "body": [
      "Each project includes a defined number of revision rounds based on the project scope and overall engagement value:"
    ],
    "bullets": [
      "Standard Projects: Up to 2 rounds of revisions.",
      "Premium Projects: Up to 3 rounds of revisions."
    ],
    "afterBullets": [
      "The applicable revision allowance, and whether a project is treated as Standard or Premium, will be specified in the project proposal or Statement of Work before commencement. Any additional revisions or significant changes beyond the agreed scope may incur additional charges and require revised timelines."
    ]
  },
  {
    "id": "intellectual-property",
    "heading": "7. Intellectual Property",
    "body": [
      "Unless otherwise agreed in writing:"
    ],
    "bullets": [
      "Clients retain ownership of the original materials, content and intellectual property they provide.",
      "On receipt of full payment for a deliverable, Decbricks assigns to the client, worldwide and in perpetuity, all rights, including copyright, in the custom-developed deliverables for that engagement, and the assignment does not lapse through non-use. Until then, Decbricks retains ownership of the work in progress. Decbricks also grants the client a perpetual, worldwide, non-exclusive, royalty-free licence to use any Decbricks pre-existing materials incorporated in the deliverables, as part of them.",
      "Decbricks retains ownership of its pre-existing tools, frameworks, code libraries, reusable components, methodologies, know-how and internal resources.",
      "Decbricks may reuse general skills, techniques and anonymised lessons learned from an engagement.",
      "Third-party software, libraries, fonts, plugins, stock media and other licensed materials remain subject to their respective licence terms. We will identify what we used on request."
    ],
    "afterBullets": [
      "Decbricks may request permission to showcase completed projects in its portfolio, website or promotional materials. Client-specific confidential information will not be disclosed without appropriate authorisation."
    ]
  },
  {
    "id": "third-party-services",
    "heading": "8. Third-Party Services",
    "body": [
      "Certain projects may involve third-party platforms, hosting providers, APIs, payment gateways, software tools or other external services.",
      "Decbricks is not responsible for interruptions, policy changes, security incidents or service failures originating from third-party providers, although we will make reasonable efforts to assist clients in resolving project-related issues."
    ]
  },
  {
    "id": "confidentiality",
    "heading": "9. Confidentiality",
    "body": [
      "Both Decbricks and its clients agree to treat non-public business information, project details, credentials, documents and other confidential materials with reasonable care, and to use them only for the purposes of the project.",
      "Such information will not be disclosed to unauthorised parties except where necessary for project execution, required by law, authorised by the relevant party, or already public. These obligations continue after a project ends."
    ]
  },
  {
    "id": "warranties-and-disclaimers",
    "heading": "10. Warranties and Disclaimers",
    "body": [
      "We warrant that our services will be performed with reasonable skill and care and in line with the agreed requirements and professional standards.",
      "For 14 days after launch, Decbricks will fix, at no charge, defects where a deliverable does not work as specified in the statement of work. New features, content changes, and issues caused by third-party platforms or client edits are not defects and are quoted separately.",
      "Beyond that, and to the extent permitted by applicable law, the website and our services are provided \"as is\", and we disclaim all other warranties, including fitness for a particular purpose.",
      "We do not guarantee uninterrupted or error-free website availability, specific search engine rankings, advertising performance, business growth, revenue or other commercial outcomes."
    ]
  },
  {
    "id": "limitation-of-liability",
    "heading": "11. Limitation of Liability",
    "body": [
      "To the extent permitted by applicable law, Decbricks' total liability for any claim connected to the website or an engagement is limited to the fees paid to us for the engagement giving rise to the claim.",
      "Neither party is liable for indirect or consequential losses, including lost profits or data, arising from the use of our services or third-party platforms.",
      "Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited."
    ]
  },
  {
    "id": "termination",
    "heading": "12. Termination",
    "body": [
      "Either party may end an engagement by giving 14 days' written notice for projects, or 30 days' written notice for retainers, in accordance with the applicable project agreement.",
      "Upon termination:"
    ],
    "bullets": [
      "Outstanding payments for completed work and agreed expenses, including costs incurred up to the termination date, remain payable.",
      "Decbricks will hand over completed deliverables that have been paid for up to that point.",
      "Access to project resources may be withdrawn where appropriate.",
      "Confidentiality obligations continue.",
      "The 50% advance is non-refundable once work has started. If an engagement ends early, Decbricks invoices work completed and work in progress up to the termination date and credits the advance against that invoice. Any other refunds are handled according to the agreed payment and project terms."
    ],
    "afterBullets": [
      "Decbricks may suspend or terminate services immediately in cases of overdue payment, misuse, unlawful activity, a request to work with infringing or unlawful material, or material breach of these Terms."
    ]
  },
  {
    "id": "website-usage",
    "heading": "13. Website Usage",
    "body": [
      "Users agree not to:"
    ],
    "bullets": [
      "Attempt unauthorised access to our website or systems.",
      "Distribute malicious software or harmful content.",
      "Copy or reproduce website content without permission.",
      "Misuse our contact forms or communication channels.",
      "Engage in activities that interfere with the operation of our website."
    ]
  },
  {
    "id": "privacy",
    "heading": "14. Privacy",
    "body": [
      "We handle personal information as described in our Privacy Policy. Where project materials are shared with collaborators, including those outside India, we share only what is needed for the work and require them to protect it under the confidentiality and security expectations in Section 5.",
      "If your project involves us processing personal data on your behalf (for example, your customers' data in an application we build), we will agree data-processing terms with you in the statement of work or a separate data-processing agreement."
    ]
  },
  {
    "id": "changes-to-these-terms",
    "heading": "15. Changes to These Terms",
    "body": [
      "Decbricks may update these Terms periodically to reflect changes in our services, business practices or legal requirements.",
      "Updated versions will be published on this page with a revised Last Updated date and apply from that date. For ongoing engagements, the version in force when the statement of work was signed applies to that engagement."
    ]
  },
  {
    "id": "governing-law-and-disputes",
    "heading": "16. Governing Law and Disputes",
    "body": [
      "These Terms, and every engagement with Decbricks, are governed by the laws of India.",
      "If a dispute arises, the parties will first try to resolve it through good-faith discussion for 30 days. If it remains unresolved:"
    ],
    "bullets": [
      "Clients based in India: the dispute is subject to the jurisdiction of the competent courts in Chennai, Tamil Nadu, India, subject to applicable law.",
      "Clients based outside India: the dispute will be finally resolved by arbitration under the Arbitration and Conciliation Act, 1996, before a sole arbitrator appointed by agreement within 15 days of a notice of arbitration, failing which in accordance with that Act, seated in Chennai, Tamil Nadu, India. The language of the arbitration is English. The Madras High Court has supervisory jurisdiction over the arbitration, and either party may seek urgent interim relief from any competent court. Decbricks may also sue for unpaid fees in the competent courts at Chennai."
    ],
    "afterBullets": [
      "Nothing in this section stops either party from seeking urgent protection of its confidential information or intellectual property from a court of competent jurisdiction."
    ]
  },
  {
    "id": "clients-and-visitors-outside-india",
    "heading": "17. Clients and Visitors Outside India",
    "body": [
      "Decbricks follows Indian law, and we aim to work smoothly with clients elsewhere. For international clients:"
    ],
    "bullets": [
      "Local mandatory rights. If you are a consumer, or the law of your country gives you rights that cannot be waived by contract, nothing in these Terms removes them. In that case, these Terms apply to the fullest extent your local law allows.",
      "Currency, taxes and payment. Invoices are issued in the currency stated in the statement of work. You bear any withholding taxes, duties, bank charges and currency-conversion costs, and we will receive the full invoiced amount unless the statement of work says otherwise. Indian taxes, where applicable, are shown on the invoice.",
      "Sanctions and export rules. Neither party will use the services in breach of applicable sanctions or export-control laws. We may decline or stop work where continuing would break such laws.",
      "Language and notices. The English version of these Terms is the governing version. Formal notices are given by email to the addresses in the statement of work.",
      "Your local compliance. You are responsible for making sure that what we build for you (for example, cookie notices, accessibility, consumer-law disclosures or sector rules in your market) meets the requirements where your users are, unless the statement of work says we will handle a specific item.",
      "Time zones and timelines. Dates and deadlines follow India Standard Time unless the statement of work says otherwise."
    ]
  },
  {
    "id": "general",
    "heading": "18. General",
    "body": [],
    "bullets": [
      "Entire agreement. These Terms and the signed statement of work are the whole agreement for an engagement and replace earlier discussions about it.",
      "Severability. If a part of these Terms is found unenforceable, the rest stays in force.",
      "No waiver. Not enforcing a right straight away does not give it up.",
      "Assignment. Neither party may transfer an engagement to someone else without the other's written consent, except to a successor of the whole business.",
      "Events beyond our control. Neither party is liable for delay or failure caused by events outside its reasonable control (such as natural disasters, power or internet outages, government action or third-party platform failures), provided it tells the other promptly and tries to limit the effect. Payment obligations for work already done continue.",
      "Independent parties. Nothing here makes either party the partner, employee or agent of the other."
    ]
  },
  {
    "id": "contact-us",
    "heading": "19. Contact Us",
    "body": [
      "For questions, clarifications or concerns regarding these Terms of Service, contact us through the contact form on our website or at:",
      "Email: hello@decbricks.com",
      "Website: https://decbricks.com"
    ]
  }
];

const PRIVACY: LegalSection[] = [
  {
    "id": "who-we-are-and-how-to-reach-us-privacy",
    "heading": "1. Who we are and how to reach us",
    "body": [
      "\"Decbricks\", \"we\", \"us\" and \"our\" mean the founders of Decbricks, based in Chennai, India, who operate decbricks.com. We decide why and how your personal data is processed, which makes us the Data Fiduciary under the DPDP Act.",
      "Privacy questions and grievances go to our designated contact (Grievance Contact, Decbricks): 99507 64003, hello@decbricks.com."
    ]
  },
  {
    "id": "data-we-collect-privacy",
    "heading": "2. Data we collect",
    "body": [
      "We collect only what each feature below needs."
    ],
    "bullets": [
      "Contact form (name, business email, company, website, country, service required, estimated budget, project timeline, your message, and your consent to submit): sent through the form service Formspree (formspree.io), which delivers it as an email to our team inbox. The form service stores submissions and may run spam checks on what you send.",
      "Booking a call (when the booking widget is enabled): the scheduling service Cal.com processes the name, email and any details you enter to create the meeting.",
      "Cookies and similar storage: we use only essential cookies and similar storage that the site needs to work. We do not use analytics or advertising cookies.",
      "Server logs: our hosting provider, Vercel, records standard request data (page requested, approximate IP address, timestamp, browser type) to operate and secure the site."
    ],
    "afterBullets": [
      "If you become a client, the materials you share for your project (content, files, credentials, business data) are handled under your statement of work and the confidentiality terms in our Terms of Service, in addition to this policy."
    ]
  },
  {
    "id": "why-we-use-it-and-on-what-basis-privacy",
    "heading": "3. Why we use it, and on what basis",
    "body": [],
    "bullets": [
      "Enquiries and bookings: to respond to you and prepare proposals. We rely on your consent, which you give by submitting the form or booking a slot, and on your voluntary provision of the data for that purpose.",
      "Essential cookies and server logs: to keep the site working and secure, as part of our duty to maintain reasonable security safeguards."
    ],
    "afterBullets": [
      "We do not use your data for any purpose beyond those above without asking you first."
    ]
  },
  {
    "id": "who-we-share-it-with-privacy",
    "heading": "4. Who we share it with",
    "body": [
      "We share data only with:"
    ],
    "bullets": [
      "the service providers (processors) named in Section 2, which handle form delivery, scheduling and hosting;",
      "collaborators we engage on a client project, who are bound by confidentiality and security requirements and receive only what the work needs; and",
      "government authorities or courts where the law requires it."
    ],
    "afterBullets": [
      "We do not sell personal data, and we do not share it for targeted advertising. Our current processors and their regions are Formspree (United States), Cal.com (United States), Vercel (United States, with a global edge network)."
    ]
  },
  {
    "id": "how-long-we-keep-it-privacy",
    "heading": "5. How long we keep it",
    "body": [],
    "bullets": [
      "Enquiry emails and booking records are kept for 12 months so we can follow up and keep a record of our correspondence.",
      "Server logs are kept for 12 months."
    ],
    "afterBullets": [
      "When the purpose is served and no law requires us to keep the data, we erase it. Invoice and tax records for clients are kept for as long as the law requires."
    ]
  },
  {
    "id": "your-rights-privacy",
    "heading": "6. Your rights",
    "body": [
      "The rights below follow the Digital Personal Data Protection Act, 2023, whose rights provisions are not yet fully in force; we honour them voluntarily now. You can:"
    ],
    "bullets": [
      "ask for a summary of the personal data we hold about you and how it is processed;",
      "ask us to correct, complete or update it;",
      "ask us to erase it;",
      "withdraw your consent at any time (for example, for an enquiry you have submitted), which will not affect processing already done on the basis of your consent;",
      "nominate another person to exercise these rights for you if you die or become unable to do so; and",
      "raise a grievance with us."
    ],
    "afterBullets": [
      "Write to hello@decbricks.com or use the contact form. We will acknowledge your request within 7 days and resolve it within 30 days. If you are not satisfied with our response, you may complain to the Data Protection Board of India."
    ]
  },
  {
    "id": "transfers-outside-india-privacy",
    "heading": "7. Transfers outside India",
    "body": [
      "Our processors operate in the United States (Formspree, Cal.com and Vercel, which also serves content through a global edge network). Where your data leaves India, we transfer it only to providers that protect it under contractual safeguards, including data processing agreements with each processor, and not to any country the Government of India has restricted."
    ]
  },
  {
    "id": "security-privacy",
    "heading": "8. Security",
    "body": [
      "The site is served over HTTPS, form submissions use encrypted transport, and access to our inbox and booking dashboard is protected by access controls and reasonable technical and organisational security measures. If a personal data breach affects you, we will notify you and the Data Protection Board of India as the law requires.",
      "No online service is perfectly secure, so please do not send sensitive information (government ID numbers, payment card details, health data, passwords) through the contact form."
    ]
  },
  {
    "id": "children-privacy",
    "heading": "9. Children",
    "body": [
      "This website is aimed at businesses and is not directed at children. In India, a child is anyone under 18. We do not knowingly collect data from children, and we do not offer a way to give the parental consent that would be required. If you believe a child has submitted data to us, contact us and we will delete it."
    ]
  },
  {
    "id": "changes-to-this-policy-privacy",
    "heading": "10. Changes to this policy",
    "body": [
      "We update this policy when our processing changes. The version on this page, with its Last Updated date, is the current one. If a change affects how we use data you have already given us, we will ask for your consent again where the law requires it."
    ]
  },
  {
    "id": "if-you-are-outside-india-privacy",
    "heading": "11. If you are outside India",
    "body": [
      "Decbricks follows Indian law and applies the same practices to everyone who uses our site. If you are in another country, the following also applies:"
    ],
    "bullets": [
      "Where your data goes. When you submit a form or book a call, your data is sent to India and to the processors in Section 4, whose locations are listed there. By submitting, you understand your data will be processed in those places.",
      "Rights in your country. The laws where you live may give you rights similar to those in Section 6, such as access, correction, deletion, objection, portability, and withdrawal of consent. Send your request to hello@decbricks.com and we will handle it under the law that applies to you, as far as we are able. You may also complain to your local data-protection authority.",
      "Legal basis. Where your local law requires a legal basis, we rely on your consent, or on taking steps at your request before a contract.",
      "Safeguards for transfers. Where your local law requires a safeguard for sending data abroad, we use appropriate contractual, confidentiality and data protection safeguards with the processors involved.",
      "Client data. If we handle personal data for you as a client, we act on your instructions and will agree data-processing terms with you.",
      "No sale of data. We do not sell personal data or share it for targeted advertising, in the sense those terms are used in laws such as California's."
    ]
  },
  {
    "id": "contact-privacy",
    "heading": "12. Contact",
    "body": [
      "Questions, requests and grievances about this policy: hello@decbricks.com, or through the contact form at decbricks.com."
    ]
  }
];

export const TERMS_DOC: TermsDocument = {
  slug: 'terms',
  title: 'Terms of Service',
  seoTitle: 'Terms of Service & Privacy Policy | Decbricks',
  seoDescription:
    'Terms of Service and Privacy Policy governing your access to and use of the Decbricks website (decbricks.com), services and digital solutions.',
  updated: "16th November, 2026",
  intro: "Welcome to Decbricks. These Terms of Service govern your access to and use of the Decbricks website, services and digital solutions. By accessing our website or engaging our services, you agree to the terms below. If you do not agree, please do not use the website or submit enquiries through it.",
  preamble: ["Decbricks is an Indian business and these Terms are governed by Indian law, wherever you are located. Section 17 adds a few points for clients and visitors outside India."],
  heroHeading: ['Terms', 'Of Service'] as const,
  sections: TERMS,
  privacy: {
    id: 'privacy-policy',
    heading: 'Privacy Policy',
    updated: "16th November, 2026",
    preamble: ["This policy explains what personal data the Decbricks website collects, why we collect it, and the choices you have. It should be read together with our Terms of Service.", "Decbricks is based in India and handles personal data under Indian law: the Information Technology Act, 2000 and its rules, and the Digital Personal Data Protection Act, 2023 (the \"DPDP Act\") as its provisions come into force. Section 11 explains what this means if you are outside India."],
    sections: PRIVACY,
  },
};
