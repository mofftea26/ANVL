/**
 * Designed code defaults for the About page — the complete page as shipped.
 * `resolveAboutContent` merges the CMS slice over these; every field here is
 * required so scene components never null-check.
 */

export interface AboutResolvedCta {
  label: string
  href: string
}

export interface AboutResolvedHotspot {
  id: string
  label: string
  description: string
  x: number
  y: number
}

export interface AboutResolvedProcessStep {
  id: string
  eyebrow: string
  title: string
  body: string
  hotspots: AboutResolvedHotspot[]
}

export interface AboutResolvedStat {
  id: string
  label: string
  value: string
  suffix: string
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
  philosophy: {
    eyebrow: string
    lines: string[]
  }
  process: {
    eyebrow: string
    title: string
    steps: AboutResolvedProcessStep[]
  }
  stats: {
    eyebrow: string
    title: string
    items: AboutResolvedStat[]
  }
  finale: {
    eyebrow: string
    title: string
    body: string
    primaryCta: AboutResolvedCta
    secondaryCta: AboutResolvedCta
    tagline: string
  }
}

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
  philosophy: {
    eyebrow: 'The Philosophy',
    lines: [
      'Pressure is not the enemy.',
      'It is the method.',
      'Discipline is worn, not spoken.',
      'Every rep is a promise kept in silence.',
      'The oath never expires.',
    ],
  },
  process: {
    eyebrow: 'The Forge',
    title: 'How a piece earns the crest',
    steps: [
      {
        id: 'materials',
        eyebrow: '01 · Materials',
        title: 'Chosen Under Scrutiny',
        body: 'Heavy cotton, honest stretch, and compression that holds its shape — every fabric earns its place before it touches a pattern. We reject anything that feels premium standing still but folds under a heavy set.',
        hotspots: [],
      },
      {
        id: 'construction',
        eyebrow: '02 · Construction',
        title: 'Built to Outlast the Session',
        body: 'Flat-lock seams, reinforced stress points, and double-stitched hems — the details that never show up in a product photo but decide whether a piece survives leg day, pull day, and the walk home.',
        hotspots: [
          { id: 'seam', label: 'Flat-lock seam', description: 'Lies flat against the skin under load — no chafing, no blowouts.', x: 28, y: 62 },
          { id: 'cuff', label: 'Reinforced cuff', description: 'Double-passed stitching holds its shape through hundreds of reps.', x: 74, y: 30 },
          { id: 'hem', label: 'Double-stitched hem', description: 'The last line that fails on cheaper gear — reinforced here first.', x: 50, y: 88 },
        ],
      },
      {
        id: 'testing',
        eyebrow: '03 · Testing',
        title: 'Proven Under Pressure',
        body: 'Before a single unit ships, every pattern is pulled, stretched, and stress-tested past what a training session will ever demand — because "forged under pressure" is a standard, not a slogan.',
        hotspots: [],
      },
    ],
  },
  stats: {
    eyebrow: 'By The Numbers',
    title: 'Fun facts from the floor',
    items: [
      { id: 'hours', label: 'Hours of pattern testing per drop', value: '500', suffix: '+' },
      { id: 'iterations', label: 'Fit iterations before approval', value: '3', suffix: 'x' },
      { id: 'made', label: 'Lebanon-made', value: '100', suffix: '%' },
      { id: 'origin', label: 'Origin city', value: 'Beirut', suffix: '' },
      { id: 'excuses', label: 'Excuses accepted', value: '0', suffix: '' },
    ],
  },
  finale: {
    eyebrow: 'Enter the House',
    title: 'The Oath Continues',
    body: 'Drop 01 is only the beginning. Every release that follows is measured against the same standard — training first, discipline always, forged under pressure.',
    primaryCta: { label: 'Shop Drop 01', href: '/shop' },
    secondaryCta: { label: 'Contact the House', href: '/contact' },
    tagline: 'Forged Under Pressure.',
  },
}
