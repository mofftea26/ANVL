import type { LandingPageCmsContent } from './landingCms.types'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import { publicLandingActsFromSequence } from '@/features/admin/drops/acts/landingActs.normalize'

export const LANDING_CMS_VERSION = 1

/**
 * Frozen reference copy of the original ANVL landing page content.
 * The admin CMS bootstraps from this every time storage is empty or
 * the user hits "Reset all landing content".
 *
 * Strings are ported verbatim from the original homepage components
 * so reverting in the admin UI matches the hand-tuned typographic
 * cadence the design was authored with.
 */
export const landingCmsDefaults: LandingPageCmsContent = {
  version: LANDING_CMS_VERSION,
  updatedAt: '1970-01-01T00:00:00.000Z',

  seo: {
    title: 'ANVL Athletics | Forged Under Pressure',
    description:
      'Premium bodybuilding gymwear built for disciplined lifters. Drop 01: The Oath.',
    path: '/',
    ogTitle: 'ANVL Athletics | Forged Under Pressure',
    ogDescription:
      'Premium bodybuilding gymwear built for disciplined lifters. Drop 01: The Oath.',
    ogImage: '/brand/og-default.svg',
  },

  navigation: {
    headerLinks: [
      { id: 'nav-shop', label: 'Shop', href: '/shop', isVisible: true },
      {
        id: 'nav-the-oath',
        label: 'The Oath',
        href: '/drop/the-oath',
        isVisible: true,
      },
      { id: 'nav-about', label: 'About', href: '/about', isVisible: true },
      {
        id: 'nav-size-guide',
        label: 'Size Guide',
        href: '/size-guide',
        isVisible: true,
      },
    ],
    footerLinks: [
      { id: 'footer-shop', label: 'Shop', href: '/shop', isVisible: true },
      { id: 'footer-about', label: 'About', href: '/about', isVisible: true },
      {
        id: 'footer-size-guide',
        label: 'Size Guide',
        href: '/size-guide',
        isVisible: true,
      },
      {
        id: 'footer-returns',
        label: 'Returns',
        href: '/returns',
        isVisible: true,
      },
    ],
    footerTagline: 'Premium bodybuilding gymwear for serious lifters.',
    footerMicroCaption: 'Forged Under Pressure',
    newsletterTitle: 'Newsletter',
    newsletterPlaceholder: 'Email address',
    newsletterButtonText: 'Join',
  },

  hero: {
    actLabel: 'Act I — Forged Under Pressure',
    badgeText: 'Drop 01 — The Oath',
    title: 'FORGED UNDER PRESSURE',
    subtitle:
      'Premium bodybuilding gymwear built through pressure, repetition, discipline, and heat.',
    primaryCta: { label: 'Explore Drop 01', href: '/drop/the-oath' },
    secondaryCta: { label: 'Join Waitlist', href: '#waitlist' },
    meta: [
      { id: 'hero-meta-drop', label: 'Drop', value: '01' },
      { id: 'hero-meta-pieces', label: 'Pieces', value: '03' },
      { id: 'hero-meta-status', label: 'Status', value: 'Soon' },
    ],
  },

  manifesto: {
    actLabel: 'Act II — The Manifesto',
    counterLabel: '04 Tenets',
    heading:
      'A body built through pressure, repetition, discipline, and heat.',
    intro:
      'The tenets we live by. Every piece is built around them, and every rep is a quiet promise to honor them.',
    tenets: [
      {
        id: 'tenet-discipline',
        text: 'Discipline Builds Freedom',
        isVisible: true,
      },
      {
        id: 'tenet-every-rep',
        text: 'Every Rep Is A Promise',
        isVisible: true,
      },
      {
        id: 'tenet-never-expires',
        text: 'The Oath Never Expires',
        isVisible: true,
      },
      {
        id: 'tenet-forged',
        text: 'Forged Under Pressure',
        isVisible: true,
      },
    ],
  },

  dropReveal: {
    actLabel: 'Act III — The Drop',
    counterLabel: '01 / 01',
    words: ['DROP', '01', 'THE', 'OATH'],
    tagline:
      'The first ANVL release. Three forged pieces — built for serious lifters, finished for streetwear hours. Numbered, limited, and made to be worn through pressure.',
    stats: [
      { id: 'drop-stat-pieces', label: 'Pieces', value: '03' },
      { id: 'drop-stat-edition', label: 'Edition', value: 'Numbered' },
      { id: 'drop-stat-run', label: 'Run', value: 'Limited' },
    ],
    primaryCta: { label: 'Explore Drop 01', href: '/drop/the-oath' },
    secondaryCta: { label: 'View the pieces', href: '/shop' },
    dropIcon: {
      src: '',
      alt: 'Drop mark',
    },
  },

  pieces: {
    actLabel: 'Act IV — The Pieces',
    headingLineOne: 'Three pieces.',
    headingLineTwo: 'One oath.',
    viewAllLabel: 'View all',
    viewAllHref: '/shop',
    footerLeftText: 'Numbered editions · Drop 01',
    footerLinkLabel: 'Drop story',
    footerLinkHref: '/drop/the-oath',
  },

  materials: {
    actLabel: 'Act V — Materials & Quality',
    counterSuffix: 'Engineered',
    heading: 'Engineered for the body that pays the bill.',
    intro:
      'Heavyweight cotton, premium stretch blends, dense compression knits and woven finish details — every material is chosen for shape, recovery and feel under load.',
    materials: [
      {
        id: 'material-heavyweight-cotton',
        code: 'M.01',
        title: 'Heavyweight cotton',
        description:
          'Dense knit and strong shape retention for premium oversized silhouettes.',
        isFeatured: true,
        isVisible: true,
      },
      {
        id: 'material-stringer',
        code: 'M.02',
        title: 'Old-school stretch stringer',
        description:
          'Breathable cotton-elastane blend with controlled armhole shape.',
        isFeatured: false,
        isVisible: true,
      },
      {
        id: 'material-compression',
        code: 'M.03',
        title: 'Strong compression fabric',
        description:
          'High-recovery technical blend engineered for second-skin support.',
        isFeatured: false,
        isVisible: true,
      },
      {
        id: 'material-woven',
        code: 'M.04',
        title: 'Woven labels',
        description:
          'Premium label and finishing details built for elevated presentation.',
        isFeatured: false,
        isVisible: true,
      },
      {
        id: 'material-industrial',
        code: 'M.05',
        title: 'Dark industrial detailing',
        description:
          'Subtle forged textures and tonal accents across all pieces.',
        isFeatured: false,
        isVisible: true,
      },
    ],
  },

  waitlist: {
    actLabel: 'Act VI — Join The Oath',
    rightLabel: 'Final · Drop 01',
    heading: 'Take the oath.',
    intro:
      'Drop 01 launches in limited quantities. Reserve your place before public release — manifesto, sizing guide and first-look imagery land in your inbox.',
    bullets: [
      {
        id: 'bullet-priority',
        text: 'Priority access window',
        isVisible: true,
      },
      {
        id: 'bullet-sizing',
        text: 'Sizing & fit recommendations',
        isVisible: true,
      },
      {
        id: 'bullet-manifesto',
        text: 'Manifesto in your inbox',
        isVisible: true,
      },
    ],
    form: {
      emailLabel: 'Email',
      emailPlaceholder: 'you@anvil.com',
      firstNameLabel: 'First Name (optional)',
      firstNamePlaceholder: '',
      preferredProductLabel: 'Preferred Product (optional)',
      preferredProductPlaceholder: 'Select product',
      submitLabel: 'Join Waitlist',
      submittingLabel: 'Submitting...',
      successToast: 'You are on the waitlist.',
    },
  },
  landingActs: publicLandingActsFromSequence(defaultLandingActSequence()),
}

export function cloneLandingCmsDefaults(): LandingPageCmsContent {
  return JSON.parse(JSON.stringify(landingCmsDefaults)) as LandingPageCmsContent
}
