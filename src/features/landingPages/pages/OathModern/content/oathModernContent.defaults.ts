/**
 * Designed code defaults for The Oath Modern (key `theoath-modern`).
 *
 * Every field the storefront renders has a value here, so an empty CMS blob still
 * produces the complete ceremonial page. {@link resolveOathModernContent} merges
 * the published slice over these; blank/whitespace CMS values fall back here.
 *
 * Voice: carved, sworn, mythological — the oath as a rite, not a slogan. The
 * reference image is the quality bar (dark depth, forged material); the emotion
 * is ceremonial.
 */

export type OmResolvedCta = { label: string; href: string }
export type OmResolvedPair = { id: string; label: string; line: string }

export type OmThresholdSettings = {
  particleIntensity: number
  fogIntensity: number
  animationIntensity: number
  layoutAlign: 'left' | 'center'
  enable3d: boolean
}

export type OmResolvedContent = {
  threshold: {
    eyebrow: string
    heading: string
    highlightWords: string[]
    body: string
    primaryCta: OmResolvedCta
    secondaryCta: OmResolvedCta
    scrollPrompt: string
    heroProductSlug: string
    settings: OmThresholdSettings
  }
  pressure: {
    eyebrow: string
    heading: string
    body: string
    vows: OmResolvedPair[]
  }
  formation: {
    eyebrow: string
    heading: string
    body: string
    marks: OmResolvedPair[]
  }
  oath: {
    eyebrow: string
    heading: string
    lines: string[]
    attribution: string
  }
  collection: {
    eyebrow: string
    title: string
    viewAllLabel: string
    viewAllHref: string
    heroProductSlug: string
    taglines: Record<string, string>
  }
  conversion: {
    eyebrow: string
    title: string
    body: string
    primaryCta: OmResolvedCta
    secondaryCta: OmResolvedCta
    tagline: string
    reassurances: string[]
  }
}

export const OM_DEFAULT_CONTENT: OmResolvedContent = {
  threshold: {
    eyebrow: 'Drop 01 — The Oath',
    heading: 'Sworn in steel',
    highlightWords: ['steel'],
    body: 'Every thread bound under heat and pressure. This is not apparel. It is a vow you wear into the work.',
    primaryCta: { label: 'Enter the rite', href: '/shop' },
    secondaryCta: { label: 'Read the oath', href: '#oath' },
    scrollPrompt: 'Descend',
    heroProductSlug: 'compression-tee',
    settings: {
      particleIntensity: 0.6,
      fogIntensity: 0.5,
      animationIntensity: 1,
      layoutAlign: 'left',
      enable3d: true,
    },
  },
  pressure: {
    eyebrow: 'I — Pressure',
    heading: 'What pressure makes',
    body: 'A body is not given. It is forged — under load, under repetition, under heat that will not relent. The oath is sworn to four masters.',
    vows: [
      { id: 'pressure', label: 'Pressure', line: 'Load that reshapes what it cannot break.' },
      { id: 'repetition', label: 'Repetition', line: 'The same vow, kept ten thousand times.' },
      { id: 'discipline', label: 'Discipline', line: 'Order held when nothing forces it.' },
      { id: 'heat', label: 'Heat', line: 'The temper that sets the form for good.' },
    ],
  },
  formation: {
    eyebrow: 'II — Formation',
    heading: 'Forged, not sewn',
    body: 'Knit in one pass, bonded where lesser garments are stitched, tuned to move with the body under tension. Construction you feel before you read it.',
    marks: [
      { id: 'seamless', label: 'Seamless knit', line: 'One continuous structure — no seams to fail.' },
      { id: 'compression', label: 'Graduated compression', line: 'Support mapped to the muscle that needs it.' },
      { id: 'ventilation', label: 'Open ventilation', line: 'Heat channelled out where the work runs hottest.' },
      { id: 'bonded', label: 'Bonded edges', line: 'Welded hems that hold their line under load.' },
    ],
  },
  oath: {
    eyebrow: 'III — The Oath',
    heading: 'The words we keep',
    lines: [
      'I will meet the weight that is given.',
      'I will not break what I have sworn to build.',
      'I will return when it is easier to rest.',
      'I am forged under pressure.',
    ],
    attribution: '— The Oath, Drop 01',
  },
  collection: {
    eyebrow: 'IV — The Armory',
    title: 'Three pieces. One oath.',
    viewAllLabel: 'View the drop',
    viewAllHref: '/shop',
    heroProductSlug: 'compression-tee',
    taglines: {
      'compression-tee': 'The second skin. Sworn to the muscle.',
      'oversized-tee': 'The mantle. Worn between the work.',
      stringer: 'The bare vow. Nothing between you and the iron.',
    },
  },
  conversion: {
    eyebrow: 'V — The Vow',
    title: 'Drop 01 is live',
    body: 'The forge is open. Take the piece, swear the oath, and carry it into the work.',
    primaryCta: { label: 'Claim your piece', href: '/shop' },
    secondaryCta: { label: 'Size guide', href: '/size-guide' },
    tagline: 'Forged Under Pressure',
    reassurances: [
      'Free returns within 30 days',
      'Ships from Beirut worldwide',
      'True-to-size — see the guide',
    ],
  },
}
