import type { ImageMetadata } from 'astro';
import type { AboutSection } from './about';
import strategyConsultingPic from '../assets/service/strategy-consulting.png';
import designBrandingPic from '../assets/service/design-branding.png';
import webSoftwarePic from '../assets/service/web-n-software-development.png';
import mobileAppPic from '../assets/service/mobile-app-development.png';
import aiAutomationPic from '../assets/service/ai-automation.png';
import digitalMarketingPic from '../assets/service/digital-marketing-n-growth.png';
import businessOutreachPic from '../assets/service/business-development-n-outreach.png';

export type ServiceId =
  | 'strategy-consulting'
  | 'design-branding'
  | 'web-software-development'
  | 'mobile-app-development'
  | 'ai-automation'
  | 'digital-marketing-growth'
  | 'business-development-outreach';

export type ServiceMedia = {
  kind: 'image';
  src: ImageMetadata;
  alt: string;
  position?: string;
};

export interface ServiceItem {
  id: ServiceId;
  number: string;
  eyebrow: string;
  title: string;
  navLabel: string;
  lead: string;
  paragraphs: string[];
  capabilities: string[];
  media: ServiceMedia;
  /** Homepage service card preview copy & tag overrides */
  homeSummary: string;
  homeTags: string[];
  homeExtraCount?: number;
}

export const SERVICES_SECTION_HEADER = {
  displayTitle: 'OUR EXPERTISE',
  eyebrow: 'WHAT WE DO',
  heading: 'Complete digital solutions. One trusted partner.',
  intro:
    'We bring together technology, design and business growth expertise to help companies build stronger digital foundations and create new opportunities.',
  ctaLabel: 'Explore All Services',
  ctaHref: '/services',
} as const;

export const SERVICES_HERO = {
  srTitle: 'Our Services: Our Expertise',
  headingParts: ['Our', 'Expertise'] as const,
  body: SERVICES_SECTION_HEADER.intro,
};

export const SERVICES: ServiceItem[] = [
  {
    id: 'strategy-consulting',
    number: '01',
    eyebrow: 'STRATEGY',
    title: 'Strategy & Consulting',
    navLabel: 'Strategy',
    lead: 'A clear direction for every big idea.',
    paragraphs: [
      'We help businesses identify opportunities, define product requirements and choose the right technology and strategies to achieve their objectives.',
      'At Decbricks, we partner with founders and growing teams to audit existing workflows, validate market direction and shape practical technical architectures before development begins—helping turn early concepts into focused, scalable digital products.',
    ],
    capabilities: [
      'Technology Consulting',
      'Digital Strategy',
      'Product Planning',
      'Business Process Analysis',
      'Technical Architecture',
      'Market Research',
      'Product Roadmapping',
    ],
    media: {
      kind: 'image',
      src: strategyConsultingPic,
      alt: 'Halftone illustration of two hands moving chess pieces across a board on an amber ground.',
      position: '50% 50%',
    },
    homeSummary:
      'Define what to build and which technology to use before development starts.',
    homeTags: ['Technology Consulting', 'Digital Strategy', 'Product Planning'],
  },
  {
    id: 'design-branding',
    number: '02',
    eyebrow: 'DESIGN',
    title: 'Design & Branding',
    navLabel: 'Design',
    lead: 'Make your brand impossible to overlook.',
    paragraphs: [
      'We create thoughtful digital experiences and distinctive brand identities that communicate your value, strengthen your presence and connect with your audience.',
      'From cohesive visual identities and design systems to intuitive website and application interfaces, Decbricks crafts creative assets built for clarity and consistency—backed by campaign graphics, social media creatives and marketing materials that stand out across every touchpoint.',
    ],
    capabilities: [
      'Brand Identity & Logo Design',
      'UI/UX Design',
      'Website Design',
      'Application Interface Design',
      'Graphic & Creative Design',
      'Social Media Creatives',
      'Marketing Materials',
    ],
    media: {
      kind: 'image',
      src: designBrandingPic,
      alt: 'Halftone grid of brand guideline, colour palette, and typography specimen spreads.',
      position: '50% 50%',
    },
    homeSummary:
      'Brand identities, interfaces and creative assets that make your business easy to recognise and trust.',
    homeTags: ['UI/UX Design', 'Website Design', 'Marketing Materials'],
  },
  {
    id: 'web-software-development',
    number: '03',
    eyebrow: 'ENGINEERING',
    title: 'Web & Software Development',
    navLabel: 'Web & Software',
    lead: 'Powerful digital products, built for real-world needs.',
    paragraphs: [
      'We develop modern websites, web applications and customised software that help businesses improve operations, serve customers and scale confidently.',
      'At Decbricks, we pair clean technical architecture with search-ready performance. We helped Findtern build a stronger digital presence through SEO-optimised website development, targeting 10K+ potential student and recruiter visits, and developed a digital platform for Upcoming Engineers designed to make 500+ engineering resources and career opportunities easier to discover.',
      'We also support community and event-driven launches—delivering website development for DevSummit and DSC SRM alongside digital campaigns designed to reach 5K+ students and tech enthusiasts.',
    ],
    capabilities: [
      'Website Development',
      'Web Application Development',
      'E-commerce Development',
      'Custom Software Development',
      'Frontend & Backend Development',
      'SaaS Development',
      'API Development',
      'Website Maintenance',
    ],
    media: {
      kind: 'image',
      src: webSoftwarePic,
      alt: 'Halftone side-profile portrait with a pixel-stepped interface gradient bar.',
      position: '50% 42%',
    },
    homeSummary:
      'Websites, web applications and custom software built to serve your customers and scale.',
    homeTags: ['Website Development', 'SaaS Development', 'API Development'],
  },
  {
    id: 'mobile-app-development',
    number: '04',
    eyebrow: 'MOBILE',
    title: 'Mobile App Development',
    navLabel: 'Mobile Apps',
    lead: 'Your business, within reach.',
    paragraphs: [
      'We build intuitive and scalable mobile applications designed to deliver seamless user experiences and support your business objectives.',
      'Whether launching on Android, iOS or cross-platform frameworks, Decbricks handles the full lifecycle from mobile UI/UX and backend API integration to deployment and ongoing maintenance—ensuring fast, reliable apps ready to grow with your users.',
    ],
    capabilities: [
      'Android App Development',
      'iOS App Development',
      'Cross-Platform App Development',
      'Mobile UI/UX Design',
      'Backend Development',
      'API Integration',
      'App Maintenance & Support',
    ],
    media: {
      kind: 'image',
      src: mobileAppPic,
      alt: 'Halftone artwork displaying two mobile application interface screens side by side.',
      position: '50% 50%',
    },
    homeSummary:
      'Android, iOS and cross-platform apps, from interface design through launch and maintenance.',
    homeTags: ['Android App Development', 'iOS App Development', 'Mobile UI/UX Design'],
  },
  {
    id: 'ai-automation',
    number: '05',
    eyebrow: 'INTELLIGENCE',
    title: 'AI & Automation',
    navLabel: 'AI & Automation',
    lead: 'Make technology work smarter.',
    paragraphs: [
      'We help businesses use artificial intelligence and automation to streamline workflows, improve efficiency and unlock new possibilities.',
      'Decbricks designs and integrates practical AI agents, custom chatbots and LLM-powered workflows tailored to your daily operations—connecting your existing tools to automate repetitive tasks, speed up customer responses and turn manual processes into reliable, intelligent systems.',
    ],
    capabilities: [
      'AI Agent Development',
      'AI Chatbot Development',
      'Generative AI Integration',
      'Business Process Automation',
      'Workflow Automation',
      'AI-Powered Applications',
      'LLM Integration',
      'Intelligent Business Systems',
    ],
    media: {
      kind: 'image',
      src: aiAutomationPic,
      alt: 'Halftone circuit and cable assembly overlaid with dashed coordinate telemetry lines.',
      position: '50% 50%',
    },
    homeSummary:
      'AI agents, chatbots and automations that take repetitive work off your team.',
    homeTags: ['AI Agent Development', 'LLM Integration', 'Workflow Automation'],
  },
  {
    id: 'digital-marketing-growth',
    number: '06',
    eyebrow: 'GROWTH',
    title: 'Digital Marketing & Growth',
    navLabel: 'Growth',
    lead: 'Get noticed. Reach further. Grow faster.',
    paragraphs: [
      'We help businesses strengthen their online presence, connect with potential customers and build digital marketing strategies focused on meaningful growth.',
      'From organic search foundations to paid and event-led acquisition, we have run Meta ads campaigns alongside helping Findtern build a stronger digital presence through SEO-optimised website development targeting 10K+ potential student and recruiter visits, and supporting DevSummit and DSC SRM through event marketing and digital outreach with campaigns designed to reach 5K+ students and tech enthusiasts.',
    ],
    capabilities: [
      'Search Engine Optimisation (SEO)',
      'Social Media Marketing',
      'Social Media Management',
      'Performance Marketing',
      'Content Marketing',
      'Paid Advertising (Meta Ads)',
      'Email Marketing',
      'Lead Generation',
    ],
    media: {
      kind: 'image',
      src: digitalMarketingPic,
      alt: 'Halftone print showing hands holding a folded coral and charcoal graphic sheet.',
      position: '50% 50%',
    },
    homeSummary:
      'SEO, social and paid campaigns that bring the right audience to your business.',
    homeTags: ['Search Engine Optimisation (SEO)', 'Lead Generation', 'Paid Advertising'],
  },
  {
    id: 'business-development-outreach',
    number: '07',
    eyebrow: 'OUTREACH',
    title: 'Business Development & Outreach',
    navLabel: 'Outreach',
    lead: 'Create connections that move business forward.',
    paragraphs: [
      'Business growth takes more than having a great product or service. It requires reaching the right audience, starting meaningful conversations and building relationships.',
      'At Decbricks, we help businesses identify potential customers and develop structured outreach campaigns. Our experience includes executing email and cold-calling campaigns for startups such as Findtern and Upcoming Engineers, as well as supporting DevSummit and DSC SRM through website development, event marketing and digital outreach with campaigns designed to reach 5K+ students and tech enthusiasts.',
      'From prospect research to campaign execution and follow-ups, we help businesses create new opportunities and strengthen their outreach efforts.',
    ],
    capabilities: [
      'B2B Lead Generation',
      'LinkedIn Outreach',
      'Cold Email Campaigns',
      'Cold Calling Campaigns',
      'Prospect Research',
      'Email Campaign Management',
      'Sales Development Support',
      'Client Acquisition Support',
    ],
    media: {
      kind: 'image',
      src: businessOutreachPic,
      alt: 'Halftone low-angle photograph of a group reaching hands together in a circle.',
      position: '50% 50%',
    },
    homeSummary:
      'Structured email, LinkedIn and cold-calling outreach that starts conversations with prospects.',
    homeTags: ['B2B Lead Generation', 'LinkedIn Outreach', 'Cold Email Campaigns'],
  },
];

/**
 * "How we scope and price" — closing block on /services (SEO ticket T-6).
 * Rendered with AboutBlock (ServiceBlock card chrome, no new CSS).
 * Every fact below traces to existing repo content — no invented numbers:
 * - Written proposal/SOW before work begins: `src/data/legal.ts` (§ how-it-works).
 * - Stage review window usually 5–8 days: `src/data/legal.ts` (client obligations).
 * - Revision rounds: Standard up to 2, Premium up to 3: `src/data/legal.ts` (§ revisions-and-changes).
 * - Advance + milestone schedule, "know exactly what you're getting": owner copy
 *   live on /contact (startProjectBody, src/pages/contact.astro).
 * - Invoices payable within 7 days: `src/data/legal.ts` (§ payment).
 * - 14 days post-launch defect fixes at no charge: `src/data/legal.ts` (§ warranty).
 * - Engagement models (milestone contracts / retainers / dedicated teams):
 *   .agents/product-marketing.md (business model).
 */
export const SCOPE_SECTION: AboutSection = {
  id: 'how-we-scope-and-price',
  number: '08',
  eyebrow: 'Process & Pricing',
  navLabel: 'How We Scope & Price',
  title: 'How we scope and price',
  paragraphs: [
    'No two projects are the same, so there is no fixed price list here. Every engagement starts with a conversation about your goals, audience, timeline and constraints, and begins with a written proposal — covering scope, deliverables, timeline and pricing — that we both agree on before any work starts.',
    'From there, we build in clear stages and share progress as we go, so you see the work take shape instead of waiting for a big reveal. You can bring us in for a milestone-based project, an ongoing retainer or a dedicated team — whatever matches how you work.',
  ],
  values: [
    {
      name: 'Proposal first',
      text: 'Scope, deliverables, timeline and pricing are agreed in writing before work begins, so you know exactly what you’re getting.',
    },
    {
      name: 'Staged delivery',
      text: 'We build in stages and you review each one within the window set in your proposal — usually 5–8 days — before we move on.',
    },
    {
      name: 'Revisions defined up front',
      text: 'Standard projects include up to 2 revision rounds and Premium projects up to 3, as set out in your proposal before commencement.',
    },
    {
      name: 'Milestone-based payments',
      text: 'Work starts on an agreed advance and milestone schedule; invoices are payable within 7 days.',
    },
    {
      name: 'Support after launch',
      text: 'For 14 days after launch we fix, at no charge, defects where a deliverable doesn’t work as specified in the statement of work.',
    },
    {
      name: 'Flexible engagement',
      text: 'Milestone-based project contracts, ongoing retainers or a dedicated team — sized to the work, and revisable as it grows.',
    },
  ],
};
