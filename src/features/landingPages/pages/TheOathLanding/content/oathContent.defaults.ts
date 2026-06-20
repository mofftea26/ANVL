/**
 * Default copy for Drop 01 — The Oath (key `the-oath`).
 *
 * Voice: the oath carved in stone — warriors, iron, and the standard that
 * outlives the mood. This is the complete designed voice of the page. The CMS
 * Landing Content editor overrides individual fields; anything left blank falls
 * back here, so the page is always fully written even with an empty CMS blob.
 */

export interface OathResolvedCta {
  label: string
  href: string
}

export interface OathResolvedTenet {
  id: string
  index: string
  title: string
  line: string
  marker: string
  /** Duotone placeholder base for the tenet media plane. */
  tone: string
}

export interface OathResolvedProductCopy {
  slug: string
  name: string
  role: string
  /** Duotone placeholder base for the banner. */
  tone: string
}

export interface OathResolvedContent {
  hero: {
    eyebrow: string
    headline: string
    subhead: string
    primaryCta: OathResolvedCta
    secondaryCta: OathResolvedCta
    scrollCue: string
  }
  manifesto: {
    eyebrow: string
    lines: string[]
  }
  tenets: {
    eyebrow: string
    items: OathResolvedTenet[]
  }
  products: {
    eyebrow: string
    title: string
    viewAllLabel: string
    viewAllHref: string
    taglines: Record<string, string>
  }
  finale: {
    eyebrow: string
    title: string
    body: string
    primaryCta: OathResolvedCta
    secondaryCta: OathResolvedCta
    tagline: string
  }
}

export const OATH_DEFAULT_CONTENT: OathResolvedContent = {
  hero: {
    eyebrow: 'Drop 01 — The Oath',
    headline: 'Forged Under Pressure',
    subhead:
      'Premium bodybuilding gymwear for those who took the oath — carved through pressure, repetition, discipline, and heat.',
    primaryCta: { label: 'Explore Drop 01', href: '#products' },
    secondaryCta: { label: 'Join Waitlist', href: '/auth/sign-up' },
    scrollCue: 'Approach',
  },
  manifesto: {
    eyebrow: 'The Oath',
    lines: [
      'An oath is not spoken. It is carved.',
      'Every rep is a strike of the chisel — in silence, with no audience.',
      'The stone remembers what the mood forgets.',
    ],
  },
  tenets: {
    eyebrow: 'Four Vows',
    items: [
      {
        id: 'pressure',
        index: '01',
        title: 'Pressure Is The Price',
        line: 'Load is not punishment. It is the only honest currency the body accepts.',
        marker: 'Load',
        tone: '#15171a',
      },
      {
        id: 'repetition',
        index: '02',
        title: 'Repetition Is The Proof',
        line: 'A vow re-signed with the body — set after set, in silence, with no audience.',
        marker: 'Vow',
        tone: '#1d1f21',
      },
      {
        id: 'discipline',
        index: '03',
        title: 'Discipline Builds Freedom',
        line: 'The order you impose in private is the only thing that sets you loose in public.',
        marker: 'Order',
        tone: '#101113',
      },
      {
        id: 'heat',
        index: '04',
        title: 'Heat Reveals The Metal',
        line: 'The fire does not create character. It exposes what was poured.',
        marker: 'Fire',
        tone: '#0d0e10',
      },
    ],
  },
  products: {
    eyebrow: 'The First Three',
    title: 'Three pieces. One oath.',
    viewAllLabel: 'View the full drop',
    viewAllHref: '/shop',
    taglines: {
      'the-oath-oversized-tee':
        'Heavy streetwear weight. Built for presence before and after the work.',
      'the-oath-stringer': 'Old-school cut. Built for range, heat, and hard training.',
      'the-oath-compression-tee':
        'Dense compression. Muscle-defining structure. Built to move under pressure.',
    },
  },
  finale: {
    eyebrow: 'Take The Oath',
    title: 'The Stone Stands',
    body: 'Be first through the gate when Drop 01 opens. No noise — only the vow and the iron.',
    primaryCta: { label: 'Explore Drop 01', href: '/shop' },
    secondaryCta: { label: 'Join Waitlist', href: '/auth/sign-up' },
    tagline: 'Forged Under Pressure',
  },
}

/** Brand line under the finale — never CMS-editable (global brand rule). */
export const OATH_BRAND_NAME = 'ANVL Athletics'

/**
 * Code-owned product roster — names/roles/tones for the three Drop 01 banners.
 * Live catalog data (price, image, real slug links) layers over this at
 * runtime; taglines come from the CMS `products.taglines` map by slug.
 */
export const OATH_PRODUCT_ROSTER: OathResolvedProductCopy[] = [
  {
    slug: 'the-oath-oversized-tee',
    name: 'The Oath Oversized Tee',
    role: 'Oversized Tee',
    tone: '#1a1c1f',
  },
  {
    slug: 'the-oath-stringer',
    name: 'The Oath Stringer',
    role: 'Old-school Stringer',
    tone: '#202327',
  },
  {
    slug: 'the-oath-compression-tee',
    name: 'The Oath Compression Tee',
    role: 'Compression Tee',
    tone: '#141619',
  },
]
