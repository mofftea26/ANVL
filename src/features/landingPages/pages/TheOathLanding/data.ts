/**
 * Static content for Drop 01 — The Oath (code-owned cinematic landing).
 *
 * Copy lives in code by design — landing pages are curated experiences; the CMS
 * only chooses which page is active. Products flow in at runtime;
 * {@link OATH_PRODUCTS} backs the cinematic product scenes when the live catalog
 * is empty (e.g. before Supabase/Shopify is wired).
 */

export const OATH_HERO = {
  eyebrow: 'Drop 01 — The Oath',
  title: 'Forged Under Pressure',
  subhead:
    'Premium bodybuilding gymwear built through pressure, repetition, discipline, and heat.',
  primaryCta: { label: 'Explore Drop 01', href: '#products' },
  secondaryCta: { label: 'Join Waitlist', href: '/auth/sign-up' },
} as const

/** Coordinates-style metadata (Beirut, LB) shown as small technical labels. */
export const OATH_META = {
  coords: 'N 33.8886° · E 35.5012°',
  origin: 'Beirut · LB',
  drop: 'DR-01',
} as const

export const OATH_MANIFESTO = {
  eyebrow: 'The Manifesto',
  lead: 'A body built through pressure, repetition, discipline, and heat.',
  intro:
    'The tenets we live by. Every piece is built around them, and every rep is a quiet promise to honor them.',
} as const

export interface OathChapter {
  id: string
  index: string
  title: string
  /** Short manifesto line under the title — gives each tenet a voice. */
  line: string
  /** One-word marker shown as a heraldic kicker. */
  marker: string
  /** Duotone placeholder base for the chapter media plane. */
  tone: string
}

export const OATH_CHAPTERS: OathChapter[] = [
  {
    id: 'discipline',
    index: '01',
    title: 'Discipline Builds Freedom',
    line: 'The order you impose in private is the only thing that sets you loose in public.',
    marker: 'Order',
    tone: '#15171a',
  },
  {
    id: 'promise',
    index: '02',
    title: 'Every Rep Is A Promise',
    line: 'A vow re-signed with the body — set after set, in silence, with no audience.',
    marker: 'Vow',
    tone: '#1d1f21',
  },
  {
    id: 'expire',
    index: '03',
    title: 'The Oath Never Expires',
    line: 'No off-season on the soul. The standard outlives the mood that made it.',
    marker: 'Standard',
    tone: '#101113',
  },
  {
    id: 'forged',
    index: '04',
    title: 'Forged Under Pressure',
    line: 'Heat, load, repetition. What survives the fire is yours to keep.',
    marker: 'Fire',
    tone: '#0d0e10',
  },
]

export interface OathProductCopy {
  slug: string
  name: string
  role: string
  /** Emotional product line. */
  line: string
  /** Short technical spec label. */
  tech: string
  /** Duotone placeholder base. */
  tone: string
}

export const OATH_PRODUCTS_HEADING = {
  eyebrow: 'The First Three',
  title: 'Three pieces. One oath.',
  viewAll: { label: 'View the full drop', href: '/shop' },
} as const

export const OATH_PRODUCTS: OathProductCopy[] = [
  {
    slug: 'the-oath-oversized-tee',
    name: 'The Oath Oversized Tee',
    role: 'Oversized Tee',
    line: 'Heavy streetwear weight. Built for presence before and after the work.',
    tech: '240 GSM · boxed drape · dropped shoulder',
    tone: '#1a1c1f',
  },
  {
    slug: 'the-oath-stringer',
    name: 'The Oath Stringer',
    role: 'Old-school Stringer',
    line: 'Old-school cut. Built for range, heat, and hard training.',
    tech: 'open sides · deep armhole · ribbed neck',
    tone: '#202327',
  },
  {
    slug: 'the-oath-compression-tee',
    name: 'The Oath Compression Tee',
    role: 'Compression Tee',
    line: 'Dense compression. Muscle-defining structure. Built to move under pressure.',
    tech: '4-way stretch · panelled support · sweat-wick',
    tone: '#141619',
  },
]

export const OATH_FINAL = {
  eyebrow: 'Take The Oath',
  title: 'Three pieces. One oath.',
  body: 'Be first through the gate when Drop 01 opens. No noise — only the call to forge.',
  primaryCta: { label: 'Explore Drop 01', href: '/shop' },
  secondaryCta: { label: 'Join Waitlist', href: '/auth/sign-up' },
  brand: 'ANVL Athletics',
  tagline: 'Forged Under Pressure',
} as const
