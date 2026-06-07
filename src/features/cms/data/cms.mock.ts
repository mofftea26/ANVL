import type { HomePageContent, SeoContent } from '../types/cms.types'

const homepageContent: HomePageContent = {
  hero: {
    title: 'FORGED UNDER PRESSURE',
    subtitle:
      'Premium bodybuilding gymwear built through pressure, repetition, discipline, and heat.',
    primaryCta: { label: 'Explore Drop 01', href: '/shop' },
    secondaryCta: { label: 'Join Waitlist', href: '#waitlist' },
  },
  manifesto: {
    heading: 'A body built through pressure, repetition, discipline, and heat.',
    lines: [
      'Discipline Builds Freedom',
      'Every Rep Is A Promise',
      'The Oath Never Expires',
      'Forged Under Pressure',
    ],
  },
  materials: [
    {
      title: 'Heavyweight cotton',
      description: 'Dense knit and strong shape retention for premium oversized silhouettes.',
    },
    {
      title: 'Old-school stretch stringer',
      description: 'Breathable cotton-elastane blend with controlled armhole shape.',
    },
    {
      title: 'Strong compression fabric',
      description: 'High-recovery technical blend engineered for second-skin support.',
    },
    {
      title: 'Woven labels',
      description: 'Premium label and finishing details built for elevated presentation.',
    },
    {
      title: 'Dark industrial detailing',
      description: 'Subtle forged textures and tonal accents across all pieces.',
    },
  ],
}

const seoByPath: Record<string, SeoContent> = {
  '/': {
    title: 'ANVL Athletics - Forged Under Pressure',
    description: 'Premium bodybuilding gymwear for serious lifters. Drop 01: The Oath.',
    canonicalPath: '/',
  },
  '/shop': {
    title: 'Shop - ANVL Athletics',
    description: 'Explore Drop 01: The Oath premium bodybuilding gymwear.',
    canonicalPath: '/shop',
  },
  '/story': {
    title: 'The Oath — Story | ANVL Athletics',
    description: 'The story of Drop 01 — The Oath. Oversized Tee, Stringer, and Compression Tee.',
    canonicalPath: '/story',
  },
}

export const cmsMockData = {
  homepageContent,
  announcementBar: {
    message: 'Drop 01: The Oath - Coming Soon',
    ctaLabel: 'Join the Oath',
    ctaHref: '#waitlist',
  },
  navigation: [
    { label: 'Shop', href: '/shop' },
    { label: 'Story', href: '/story' },
    { label: 'About', href: '/about' },
    { label: 'Care Guide', href: '/care-guide' },
    { label: 'Size Guide', href: '/size-guide' },
  ],
  campaigns: [
    {
      id: 'oath-drop',
      title: 'Drop 01: The Oath',
      description: 'Limited first launch for ANVL Athletics.',
    },
  ],
  lookbook: [
    { id: 'look-01', alt: 'ANVL athlete in oversized tee', src: '/brand/lookbook-1.webp' },
    { id: 'look-02', alt: 'ANVL athlete in stringer', src: '/brand/lookbook-2.webp' },
  ],
  seoByPath,
}
