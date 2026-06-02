import { create } from 'zustand'
import type { CinematicHeroSection, CinematicNavMode } from './cinematicHero.types'

export type NavScrollPhase = 'cinematic' | 'commerce'

type CinematicHeroPhaseState = {
  phase: NavScrollPhase
  navMode: CinematicNavMode
  sections: CinematicHeroSection[]
  activeSectionId: string | null
  setPhase: (phase: NavScrollPhase) => void
  setNavMode: (mode: CinematicNavMode) => void
  setSections: (sections: CinematicHeroSection[]) => void
  setActiveSectionId: (id: string | null) => void
  reset: () => void
}

export const useCinematicHeroPhaseStore = create<CinematicHeroPhaseState>((set) => ({
  phase: 'commerce',
  navMode: 'auto',
  sections: [],
  activeSectionId: null,
  setPhase: (phase) => set({ phase }),
  setNavMode: (navMode) => set({ navMode }),
  setSections: (sections) => set({ sections }),
  setActiveSectionId: (activeSectionId) => set({ activeSectionId }),
  reset: () =>
    set({ phase: 'commerce', navMode: 'auto', sections: [], activeSectionId: null }),
}))

export function useNavScrollPhase(): NavScrollPhase {
  return useCinematicHeroPhaseStore((s) => s.phase)
}
