import { HeroForgeSequence } from '@/features/marketing/components/HeroForgeSequence'
import { previewHeroFields } from '@/features/cms/landing/landingActPreviewOverlay'
import type { ActPresetProps } from '../types'

/** Default hero — wraps the forged cinematic sequence. */
export function TheOathCinematicPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const hero = previewHeroFields(landing.hero, row)
  return (
    <HeroForgeSequence
      badgeText={hero.badgeText}
      title={hero.title}
      subtitle={hero.subtitle}
      primaryCta={hero.primaryCta}
      secondaryCta={hero.secondaryCta}
      meta={landing.hero.meta}
      emblemSrc={emblemSrc}
    />
  )
}
