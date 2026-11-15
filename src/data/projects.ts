import type { ImageMetadata } from 'astro';

import dscPoster from '../assets/projects/dsc-poster.png';
import findternPoster from '../assets/projects/findtern.png';
import hackceleratePoster from '../assets/projects/hackcelerate27.png';
import uePoster from '../assets/projects/ue.png';

export type ProjectCategory = 'Brand' | 'Marketing';

export interface UndertakenProject {
  id: string;
  title: string;
  alt: string;
  src: ImageMetadata;
  categories: readonly ProjectCategory[];
}

/** Undertaken project showcase cards rendered inside Home `.parts-caseStudySlider`. */
export const PROJECTS: readonly UndertakenProject[] = [
  {
    id: 'findtern',
    title: 'Findtern',
    alt: 'Findtern brand poster featuring monochrome and forest green editorial typography reading Internship Simplified',
    src: findternPoster,
    categories: ['Brand', 'Marketing'],
  },
  {
    id: 'upcoming-engineer',
    title: 'Upcoming Engineer',
    alt: 'Upcoming Engineer brand poster with split cream and dark navy layout, architectural lettermark, and green glitch accents',
    src: uePoster,
    categories: ['Marketing'],
  },
  {
    id: 'hackcelerate-27',
    title: 'Hackcelerate ’27',
    alt: 'Hackcelerate ’27 event poster with pixel-art city skyline, floating retro monitor mascot, and sunset sky',
    src: hackceleratePoster,
    categories: ['Brand'],
  },
  {
    id: 'dsc-srm',
    title: 'Developer Students Club',
    alt: 'Developer Students Club SRM IST Ramapuram poster combining vermilion halftone typography with a classical painting detail',
    src: dscPoster,
    categories: ['Brand'],
  },
];
