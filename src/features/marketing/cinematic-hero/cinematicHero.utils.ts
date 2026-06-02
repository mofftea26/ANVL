import type { PublicLandingAct } from '@/features/cms/landing/landingActs.types'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { cinematicConfigSchema } from '@/features/admin/drops/acts/landingActs.zod'
import { defaultCinematicConfig } from './cinematicHero.defaults'
import type { CinematicConfig, CinematicHeroSection } from './cinematicHero.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'

function landingToDropHero(lc: LandingPageCmsContent) {
  return {
    hero: lc.hero,
    manifesto: lc.manifesto,
    dropReveal: lc.dropReveal,
    pieces: lc.pieces,
    materials: lc.materials,
    waitlist: lc.waitlist,
  }
}

export function parseCinematicConfig(
  _act: PublicLandingAct,
  row?: LandingAct,
  landing?: LandingPageCmsContent,
): CinematicConfig {
  const raw = (row?.content ?? {}) as Record<string, unknown>
  const parsed = cinematicConfigSchema.safeParse(raw.cinematicConfig)
  if (parsed.success && parsed.data.sections.length > 0) {
    return {
      enabled: parsed.data.enabled ?? true,
      scrollLength: parsed.data.scrollLength ?? 'standard',
      navMode: parsed.data.navMode ?? 'auto',
      backgroundMode: parsed.data.backgroundMode ?? 'video',
      reducedMotionFallback: parsed.data.reducedMotionFallback ?? {
        mode: 'stack',
        showAllSections: true,
      },
      sections: [...parsed.data.sections]
        .filter((s) => s.isEnabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }

  if (landing) {
    const lc = landingToDropHero(landing)
    return defaultCinematicConfig(lc as Parameters<typeof defaultCinematicConfig>[0])
  }

  return {
    enabled: true,
    scrollLength: 'standard',
    navMode: 'auto',
    backgroundMode: 'gradient',
    reducedMotionFallback: { mode: 'stack', showAllSections: true },
    sections: [],
  }
}

export function mergeSectionCopy(
  section: CinematicHeroSection,
  _act: PublicLandingAct,
  row?: LandingAct,
): CinematicHeroSection {
  const isFirst = section.sortOrder === 0
  return {
    ...section,
    eyebrow: section.eyebrow || (isFirst ? row?.eyebrow : section.eyebrow),
    heading: section.heading || (isFirst ? row?.title : section.heading),
    body: section.body || (isFirst ? row?.subtitle : section.body),
  }
}

export function hasCinematicScrollHeroAct(
  acts: Array<{ nature: string; preset?: string; enabled?: boolean }>,
): boolean {
  return acts.some(
    (a) =>
      a.enabled !== false &&
      a.nature === 'hero' &&
      a.preset === 'cinematicScrollHero',
  )
}
