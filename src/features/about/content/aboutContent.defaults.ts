/**
 * Designed code defaults for the About page — the complete page as shipped.
 * `resolveAboutContent` merges the CMS slice over these; every field here is
 * required so components never null-check. The seven default orbs carry the
 * whole brand story; the CMS can add/edit/remove orbs freely.
 */

export interface AboutResolvedCta {
  label: string
  href: string
}

export interface AboutResolvedPoint {
  label: string
  description: string
}

export interface AboutResolvedStat {
  id: string
  label: string
  value: string
  suffix: string
}

/** Per-orb layout preset — 'classic' is the free-form render shipped first. */
export type AboutOrbLayout = 'classic' | 'text' | 'stats' | 'map' | 'timeline'

export interface AboutResolvedMapPin {
  id: string
  /** Percent of the map image box, 0–100. */
  x: number
  y: number
  label: string
}

export interface AboutResolvedTimelineEntry {
  id: string
  marker: string
  title: string
  body: string
}

export interface AboutResolvedOrb {
  id: string
  label: string
  /** #RRGGBB — drives the orb, its halo, chip dot, and burst. */
  color: string
  /** Layout preset — varies how the renderer composes the fields below. */
  layout: AboutOrbLayout
  eyebrow: string
  title: string
  /** Editorial lead line under the title ('text' preset). */
  subhead: string
  body: string
  detail: string
  lines: string[]
  points: AboutResolvedPoint[]
  stats: AboutResolvedStat[]
  /** World-map pins ('map' preset). */
  mapPins: AboutResolvedMapPin[]
  /** Vertical milestones ('timeline' preset). */
  timeline: AboutResolvedTimelineEntry[]
  primaryCta?: AboutResolvedCta
  secondaryCta?: AboutResolvedCta
  tagline: string
  /** Resolved CMS media URL (orb-specific upload). */
  image?: string
  /** Page asset slot the default image comes from when no mediaId is set. */
  imageSlot?: string
}

export interface AboutResolvedContent {
  hero: {
    eyebrow: string
    headline: string
    subhead: string
    primaryCta: AboutResolvedCta
    secondaryCta: AboutResolvedCta
    scrollCue: string
  }
  orbs: AboutResolvedOrb[]
  marquee: {
    text: string
  }
}

/** Distinct muted-industrial orb tints (avoid neon; each orb reads its own). */
export const ABOUT_ORB_FALLBACK_COLORS = [
  '#E7E4DF', // bone
  '#E08A4A', // ember
  '#8FA3B0', // steel blue
  '#C9A227', // forged gold
  '#A34A3F', // oxide red
  '#7C8B6F', // patina green
  '#8E86A8', // cooled violet-steel
] as const

export const ABOUT_DEFAULT_CONTENT: AboutResolvedContent = {
  hero: {
    eyebrow: 'The House of ANVL',
    headline: 'Forged Under Pressure',
    subhead:
      'ANVL Athletics is built in Lebanon for lifters who keep the oath when no one is watching — heavy cotton, honest stretch, and a silhouette that survives the session.',
    primaryCta: { label: 'Shop Drop 01', href: '/shop' },
    secondaryCta: { label: 'Read the Story', href: '/story' },
    scrollCue: 'Enter the forge',
  },
  orbs: [
    {
      id: 'anvl',
      label: 'ANVL',
      color: '#E7E4DF',
      layout: 'classic',
      eyebrow: 'The House of ANVL',
      title: 'Forged in Beirut',
      subhead: '',
      body: 'ANVL Athletics is premium bodybuilding gymwear from Lebanon — built for lifters who keep the oath when no one is watching. Training comes first; the silhouette stays premium when the session ends. Every release is a promise to the lifter who shows up anyway.',
      detail: 'Est. Beirut · Lebanon · Drop 01 — The Oath',
      lines: [],
      points: [],
      stats: [],
      mapPins: [],
      timeline: [],
      tagline: 'Forged Under Pressure.',
      imageSlot: 'heroImage',
    },
    {
      id: 'creed',
      label: 'The Creed',
      color: '#E08A4A',
      layout: 'classic',
      eyebrow: 'The Philosophy',
      title: 'The Creed',
      subhead: '',
      body: '',
      detail: '',
      lines: [
        'Pressure is not the enemy.',
        'It is the method.',
        'Discipline is worn, not spoken.',
        'Every rep is a promise kept in silence.',
        'The oath never expires.',
      ],
      points: [],
      stats: [],
      mapPins: [],
      timeline: [],
      tagline: '',
      imageSlot: 'manifestoBackdrop',
    },
    {
      id: 'materials',
      label: 'Materials',
      color: '#8FA3B0',
      layout: 'classic',
      eyebrow: '01 · Materials',
      title: 'Chosen Under Scrutiny',
      subhead: '',
      body: 'Heavy cotton, honest stretch, and compression that holds its shape — every fabric earns its place before it touches a pattern. We reject anything that feels premium standing still but folds under a heavy set.',
      detail: '440 GSM heavy cotton · four-way honest stretch',
      lines: [],
      points: [],
      stats: [],
      mapPins: [],
      timeline: [],
      tagline: '',
      imageSlot: 'materialsBackdrop',
    },
    {
      id: 'construction',
      label: 'Construction',
      color: '#C9A227',
      layout: 'classic',
      eyebrow: '02 · Construction',
      title: 'Built to Outlast the Session',
      subhead: '',
      body: 'Flat-lock seams, reinforced stress points, and double-stitched hems — the details that never show up in a product photo but decide whether a piece survives leg day, pull day, and the walk home.',
      detail: 'Flat-lock seams · bar-tacked stress points',
      lines: [],
      points: [
        { label: 'Flat-lock seam', description: 'Lies flat against the skin under load — no chafing, no blowouts.' },
        { label: 'Reinforced cuff', description: 'Double-passed stitching holds its shape through hundreds of reps.' },
        { label: 'Double-stitched hem', description: 'The last line that fails on cheaper gear — reinforced here first.' },
      ],
      stats: [],
      mapPins: [],
      timeline: [],
      tagline: '',
      imageSlot: 'constructionBackdrop',
    },
    {
      id: 'testing',
      label: 'Testing',
      color: '#A34A3F',
      layout: 'classic',
      eyebrow: '03 · Testing',
      title: 'Proven Under Pressure',
      subhead: '',
      body: 'Before a single unit ships, every pattern is pulled, stretched, and stress-tested past what a training session will ever demand — because "forged under pressure" is a standard, not a slogan.',
      detail: 'Pulled 3× past session load before a unit ships',
      lines: [],
      points: [],
      stats: [],
      mapPins: [],
      timeline: [],
      tagline: '',
      imageSlot: 'testingBackdrop',
    },
    {
      id: 'numbers',
      label: 'The Numbers',
      color: '#7C8B6F',
      layout: 'classic',
      eyebrow: 'By The Numbers',
      title: 'Fun facts from the floor',
      subhead: '',
      body: '',
      detail: '',
      lines: [],
      points: [],
      stats: [
        { id: 'hours', label: 'Hours of pattern testing per drop', value: '500', suffix: '+' },
        { id: 'iterations', label: 'Fit iterations before approval', value: '3', suffix: 'x' },
        { id: 'made', label: 'Lebanon-made', value: '100', suffix: '%' },
        { id: 'origin', label: 'Origin city', value: 'Beirut', suffix: '' },
        { id: 'excuses', label: 'Excuses accepted', value: '0', suffix: '' },
      ],
      mapPins: [],
      timeline: [],
      tagline: '',
    },
    {
      id: 'oath',
      label: 'The Oath',
      color: '#8E86A8',
      layout: 'classic',
      eyebrow: 'Enter the House',
      title: 'The Oath Continues',
      subhead: '',
      body: 'Drop 01 is only the beginning. Every release that follows is measured against the same standard — training first, discipline always, forged under pressure.',
      detail: '',
      lines: [],
      points: [],
      stats: [],
      mapPins: [],
      timeline: [],
      primaryCta: { label: 'Shop Drop 01', href: '/shop' },
      secondaryCta: { label: 'Contact the House', href: '/contact' },
      tagline: 'Forged Under Pressure.',
      imageSlot: 'finaleBackdrop',
    },
  ],
  marquee: {
    text: 'Forged Under Pressure — Beirut — ANVL Athletics',
  },
}
