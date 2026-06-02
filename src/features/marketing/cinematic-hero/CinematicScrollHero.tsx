import type { ActPresetProps } from '@/features/marketing/act-presets/types'
import { CinematicHeroRoot } from './CinematicHeroRoot'
import { mergeSectionCopy, parseCinematicConfig } from './cinematicHero.utils'

export function CinematicScrollHeroPreset({
  act,
  landing,
  row,
}: ActPresetProps) {
  const config = parseCinematicConfig(act, row, landing)
  const merged = {
    ...config,
    sections: config.sections.map((s) => mergeSectionCopy(s, act, row)),
  }

  return <CinematicHeroRoot config={merged} />
}
