import { useCinematicHeroPhaseStore } from '@/features/marketing/cinematic-hero/cinematicHeroPhase.store'
import type { CinematicHeroSection } from '@/features/marketing/cinematic-hero/cinematicHero.types'
import type { NavScrollPhase } from '@/features/marketing/cinematic-hero/cinematicHeroPhase.store'

export type PremiumNavTopbarVariant = 'transparent' | 'solid'

export type PremiumNavPhase = {
  phase: NavScrollPhase
  topbarVariant: PremiumNavTopbarVariant
  isCinematic: boolean
  sections: CinematicHeroSection[]
  activeSectionId: string | null
  showSideRail: boolean
}

export function usePremiumNavPhase(): PremiumNavPhase {
  const phase = useCinematicHeroPhaseStore((s) => s.phase)
  const navMode = useCinematicHeroPhaseStore((s) => s.navMode)
  const sections = useCinematicHeroPhaseStore((s) => s.sections)
  const activeSectionId = useCinematicHeroPhaseStore((s) => s.activeSectionId)

  const isCinematic = phase === 'cinematic'
  const topbarVariant: PremiumNavTopbarVariant = isCinematic ? 'transparent' : 'solid'
  const showSideRail =
    isCinematic &&
    sections.length > 0 &&
    (navMode === 'auto' || navMode === 'sideRail')

  return {
    phase,
    topbarVariant,
    isCinematic,
    sections,
    activeSectionId,
    showSideRail,
  }
}
