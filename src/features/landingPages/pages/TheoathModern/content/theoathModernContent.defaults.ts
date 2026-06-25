/**
 * Default copy for the Theoath Modern experience (key `theoath-modern`).
 *
 * Voice: a premium technical product laboratory — engineered, precise, stoic.
 * This is the complete designed page; the CMS overrides individual fields and
 * anything blank falls back here.
 */

export interface TmResolvedCta {
  label: string
  href: string
}

export interface TmResolvedHotspot {
  id: string
  label: string
  line: string
  x: number
  y: number
}

export interface TmResolvedHeroSettings {
  particleIntensity: number
  fogIntensity: number
  animationIntensity: number
  layoutAlign: 'left' | 'center'
  enable3d: boolean
}

export interface TmResolvedBenefit {
  id: string
  icon: string
  heading: string
  description: string
  href?: string
}

export interface TmResolvedSpec {
  label: string
  value: string
}

export interface TmResolvedCallout {
  id: string
  label: string
  line: string
  mediaUrl?: string
}

export interface TmResolvedContent {
  hero: {
    eyebrow: string
    heading: string
    highlightWords: string[]
    description: string
    primaryCta: TmResolvedCta
    secondaryCta: TmResolvedCta
    scrollPrompt: string
    heroProductSlug: string
    sideIndex: string[]
    hotspots: TmResolvedHotspot[]
    settings: TmResolvedHeroSettings
  }
  techKnit: {
    eyebrow: string
    title: string
    description: string
    callouts: TmResolvedCallout[]
  }
  collection: {
    eyebrow: string
    title: string
    viewAllLabel: string
    viewAllHref: string
    heroProductSlug: string
    taglines: Record<string, string>
  }
  benefits: {
    eyebrow: string
    title: string
    items: TmResolvedBenefit[]
  }
  materials: {
    eyebrow: string
    title: string
    description: string
    specs: TmResolvedSpec[]
    notes: string[]
  }
  conversion: {
    eyebrow: string
    title: string
    body: string
    primaryCta: TmResolvedCta
    secondaryCta: TmResolvedCta
    tagline: string
  }
}

/** Hero product defaults to the compression shirt — the dominant Drop 01 piece. */
export const TM_HERO_PRODUCT_SLUG = 'compression-tee'

export const TM_DEFAULT_CONTENT: TmResolvedContent = {
  hero: {
    eyebrow: 'Drop 01 — The Oath',
    heading: 'Engineered To Endure.',
    highlightWords: ['Endure.'],
    description:
      'Seamless circular-knit compression, mapped to the working body. Structure where you load, stretch where you move, ventilation where you burn — built to outlast the work.',
    primaryCta: { label: 'Shop the compression shirt', href: '/shop/compression-tee' },
    secondaryCta: { label: 'Explore Drop 01', href: '/shop' },
    scrollPrompt: 'Enter the lab',
    heroProductSlug: TM_HERO_PRODUCT_SLUG,
    sideIndex: ['01 — Knit', '02 — Map', '03 — Move', '04 — Endure'],
    hotspots: [
      {
        id: 'seamless',
        label: 'Seamless construction',
        line: 'Circular-knit in one piece — no side seams to chafe under load.',
        x: 32,
        y: 30,
      },
      {
        id: 'compression',
        label: 'Muscle-mapped compression',
        line: 'Zoned knit density tracks the major movers for contoured support.',
        x: 64,
        y: 46,
      },
      {
        id: 'ventilation',
        label: 'Ventilation zones',
        line: 'Open-knit channels vent heat where the body runs hottest.',
        x: 40,
        y: 66,
      },
    ],
    settings: {
      particleIntensity: 0.6,
      fogIntensity: 0.5,
      animationIntensity: 0.7,
      layoutAlign: 'left',
      enable3d: true,
    },
  },
  techKnit: {
    eyebrow: 'Tech Knit Laboratory',
    title: 'One garment. Engineered zone by zone.',
    description:
      'A single circular-knit structure changes density, stretch, and porosity across the body — compression where it counts, freedom where it moves.',
    callouts: [
      {
        id: 'knit',
        label: 'Seamless circular knit',
        line: 'Knit in the round — continuous yarn, no cut-and-sew seams.',
      },
      {
        id: 'stretch',
        label: 'Adaptive stretch',
        line: 'Four-way elastane recovery holds shape rep after rep.',
      },
      {
        id: 'moisture',
        label: 'Moisture management',
        line: 'Hydrophobic yarn moves sweat off the skin and out.',
      },
      {
        id: 'durable',
        label: 'Built to endure',
        line: 'Dense premium yarn resists pilling, thinning, and fade.',
      },
    ],
  },
  collection: {
    eyebrow: 'Drop 01 — The Oath',
    title: 'Three pieces. One standard.',
    viewAllLabel: 'View the full drop',
    viewAllHref: '/shop',
    heroProductSlug: TM_HERO_PRODUCT_SLUG,
    taglines: {
      'compression-tee':
        'Dense seamless compression. Muscle-defining structure, built to move under pressure.',
      'oversized-tee':
        'Heavyweight cotton presence. Worn before and after the work.',
      stringer: 'Old-school cut. Built for range, heat, and hard training.',
    },
  },
  benefits: {
    eyebrow: 'Performance',
    title: 'Why it outperforms.',
    items: [
      {
        id: 'support',
        icon: 'shield',
        heading: 'Enhanced muscle support',
        description: 'Zoned compression steadies the major movers and reduces fatigue flutter.',
      },
      {
        id: 'thermal',
        icon: 'thermometer',
        heading: 'Thermal regulation',
        description: 'Knit ventilation channels dump heat to keep the engine cool.',
      },
      {
        id: 'movement',
        icon: 'move',
        heading: 'Unrestricted movement',
        description: 'Four-way stretch tracks every angle — no bind at full range.',
      },
      {
        id: 'moisture',
        icon: 'droplets',
        heading: 'Moisture management',
        description: 'Hydrophobic yarn wicks sweat off the skin and dries fast.',
      },
      {
        id: 'endure',
        icon: 'anvil',
        heading: 'Built to endure',
        description: 'Premium dense knit holds structure through season after season.',
      },
    ],
  },
  materials: {
    eyebrow: 'Materials & Engineering',
    title: 'Knit at the fiber level.',
    description:
      'Every spec is set in the yarn and the knit program — not printed on a label. Real numbers come from the product, entered through the CMS.',
    specs: [
      { label: 'Composition', value: '72% polyamide · 21% polyester · 7% elastane' },
      { label: 'Weight', value: '270–300 GSM' },
      { label: 'Construction', value: 'Seamless circular knit' },
      { label: 'Stretch', value: 'Four-way recovery' },
    ],
    notes: [
      'Muscle-mapped compression zones knit at variable density.',
      'Flatlock-free seamless body eliminates chafe points.',
      'Colorfast dye holds through repeated high-heat training.',
    ],
  },
  conversion: {
    eyebrow: 'Take the Oath',
    title: 'Forged for the ones who endure.',
    body: 'Drop 01 is built in limited numbers. Secure the compression shirt and the full arsenal before the gate closes.',
    primaryCta: { label: 'Shop Drop 01', href: '/shop' },
    secondaryCta: { label: 'Join the Oath', href: '/auth/sign-up' },
    tagline: 'Forged Under Pressure',
  },
}

/** Brand line — never CMS-editable (global brand rule). */
export const TM_BRAND_NAME = 'ANVL Athletics'
