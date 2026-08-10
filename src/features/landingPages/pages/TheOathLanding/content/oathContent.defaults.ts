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

export interface OathResolvedHotspot {
  id: string
  label: string
  description: string
  /** % position of the point over the product viewer. */
  x: number
  y: number
  /** Resolved material/tech "bubble" image URL when assigned. */
  bubbleUrl?: string
}

export interface OathResolvedTenet {
  id: string
  index: string
  /** Product name. */
  title: string
  /** Warrior-voiced one-liner. */
  subtitle: string
  line: string
  marker: string
  /** Duotone placeholder base for the product viewer. */
  tone: string
  /** Resolved product still URL (fallback when no GLB). */
  mediaUrl?: string
  /** Resolved product 3D model (.glb) URL. */
  modelUrl?: string
  /** Resolved smokey background URL. */
  bgUrl?: string
  /** Annotated points on the product. */
  hotspots: OathResolvedHotspot[]
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
    eyebrow: 'The Arsenal',
    items: [
      {
        id: 'oversized',
        index: '01',
        title: 'Forged Oversized Tee',
        subtitle: 'Worn between the battles — presence before the first rep is struck.',
        line: 'Heavy streetwear weight, built for the walk in and the work after.',
        marker: 'Armour',
        tone: '#1a1c1f',
        bgUrl: '/landing/the-oath/product-bg-1.webp',
        hotspots: [
          { id: 'weight', label: '260 GSM Pure Cotton', description: '100% cotton at 260 GSM — it hangs like armour and outlasts the season.', x: 38, y: 30 },
          { id: 'shoulder', label: 'Drop-Shoulder Cut', description: 'A dropped seam frames the delts and reads broad from across the floor.', x: 64, y: 44 },
          { id: 'branding', label: 'Raised Silicone Mark', description: '1 mm raised silicone branding — you feel the crest before you see it.', x: 50, y: 18 },
        ],
      },
      {
        id: 'stringer',
        index: '02',
        title: 'MARROW Stringer',
        subtitle: 'Bare for the iron — nothing left between you and the work.',
        line: 'Old-school cut with a spine down the back, built for range and heat.',
        marker: 'Bare',
        tone: '#202327',
        bgUrl: '/landing/the-oath/product-bg-2.webp',
        hotspots: [
          { id: 'armhole', label: 'Deep Armhole', description: 'A low-cut arm opens the lats and frees the shoulder through full range.', x: 36, y: 38 },
          { id: 'spine', label: 'The Spine', description: 'A vertebral seam runs the length of the back — the bone worn on the outside.', x: 58, y: 56 },
          { id: 'knit', label: 'Breathable Knit', description: 'Open ribbed knit dumps heat fast under the hardest training.', x: 48, y: 24 },
        ],
      },
      {
        id: 'compression',
        index: '03',
        title: 'OATHBOUND Seamless Compression Tee',
        subtitle: 'A second skin, sworn to the muscle it covers.',
        line: 'Seamless compression and four-way stretch, built to move under pressure.',
        marker: 'Skin',
        tone: '#141619',
        bgUrl: '/landing/the-oath/product-bg-3.webp',
        hotspots: [
          { id: 'seamless', label: 'Seamless Knit', description: 'Knit in a single pass on seamless machinery — no side seams to dig in under load.', x: 44, y: 30 },
          { id: 'stretch', label: 'Four-Way Stretch', description: 'Moves with the muscle in every direction, then returns to shape.', x: 62, y: 48 },
          { id: 'branding', label: 'Raised Silicone Mark', description: '1 mm raised silicone branding, bonded flat so nothing catches under a bar.', x: 40, y: 66 },
        ],
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
        '260 GSM pure cotton. Built for presence before and after the work.',
      'the-oath-stringer':
        'Old-school cut with a spine down the back. Built for range and heat.',
      'the-oath-compression-tee':
        'Seamless knit. Four-way stretch. Built to move under pressure.',
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
    name: 'Forged Oversized Tee',
    role: 'Oversized Tee',
    tone: '#1a1c1f',
  },
  {
    slug: 'the-oath-stringer',
    name: 'MARROW Stringer',
    role: 'Old-school Stringer',
    tone: '#202327',
  },
  {
    slug: 'the-oath-compression-tee',
    name: 'OATHBOUND Seamless Compression Tee',
    role: 'Seamless Compression Tee',
    tone: '#141619',
  },
]
