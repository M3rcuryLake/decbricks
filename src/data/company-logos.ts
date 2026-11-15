import type { ImageMetadata } from 'astro';

import barclays from '../assets/companyLogos/barclays.webp';
import chargebee from '../assets/companyLogos/chargebee.webp';
import ey from '../assets/companyLogos/ey.webp';
import findtern from '../assets/companyLogos/findtern.webp';
import fourkites from '../assets/companyLogos/fourkites.webp';
import logoutSpells from '../assets/companyLogos/logout-spells.webp';
import sparq from '../assets/companyLogos/sparq.webp';
import tcs from '../assets/companyLogos/tcs.webp';
import turing from '../assets/companyLogos/turing.webp';
import upcomingEngineer from '../assets/companyLogos/upcoming-engineer.webp';
import vedricx from '../assets/companyLogos/vedricx.webp';
import zoho from '../assets/companyLogos/zoho.webp';

export interface CompanyLogo {
  id: string;
  alt: string;
  src: ImageMetadata;
}

/** Company logo sticker badges displayed in the Home "Our Work" ticker and hover trail. */
export const COMPANY_LOGOS: readonly CompanyLogo[] = [
  { id: 'barclays', alt: 'Barclays', src: barclays },
  { id: 'ey', alt: 'EY', src: ey },
  { id: 'tcs', alt: 'TCS', src: tcs },
  { id: 'zoho', alt: 'Zoho', src: zoho },
  { id: 'chargebee', alt: 'Chargebee', src: chargebee },
  { id: 'fourkites', alt: 'FourKites', src: fourkites },
  { id: 'turing', alt: 'Turing', src: turing },
  { id: 'sparq', alt: 'Sparq', src: sparq },
  { id: 'findtern', alt: 'Findtern', src: findtern },
  { id: 'upcoming-engineer', alt: 'Upcoming Engineer', src: upcomingEngineer },
  { id: 'vedricx', alt: 'Vedricx Global LLP', src: vedricx },
  { id: 'logout-spells', alt: 'Logout Spells', src: logoutSpells },
];
