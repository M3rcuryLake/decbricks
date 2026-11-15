import type { ImageMetadata } from 'astro';

import barclays from '../assets/company-logos/barclays.png';
import chargebee from '../assets/company-logos/chargebee.png';
import ey from '../assets/company-logos/ey.png';
import findtern from '../assets/company-logos/findtern.png';
import fourkites from '../assets/company-logos/fourkites.png';
import logoutSpells from '../assets/company-logos/logout-spells.png';
import sparq from '../assets/company-logos/sparq.png';
import tcs from '../assets/company-logos/tcs.png';
import turing from '../assets/company-logos/turing.png';
import upcomingEngineer from '../assets/company-logos/upcoming-engineer.png';
import vedricx from '../assets/company-logos/vedricx.png';
import zoho from '../assets/company-logos/zoho.png';

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
