import { HeroForgeSequence } from '@/features/marketing/components/HeroForgeSequence'
import { previewHeroFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { previewCinematicHeroMedia } from '@/features/cms/landing/cinematicHeroContent'
import type { ActPresetProps } from '../types'

/** Default hero — wraps the forged cinematic sequence. */
export function TheOathCinematicPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const hero = previewHeroFields(landing.hero, row)
  const media = previewCinematicHeroMedia(landing.hero, row)
  const resolvedEmblem = media.emblemWatermarkSrc || emblemSrc

  return (
    <HeroForgeSequence
      badgeText={hero.badgeText}
      title={hero.title}
      subtitle={hero.subtitle}
      primaryCta={hero.primaryCta}
      secondaryCta={hero.secondaryCta}
      meta={media.meta}
      emblemSrc={resolvedEmblem}
      backgroundVideoUrl={media.backgroundVideoUrl}
      backgroundImageUrl={media.backgroundImageUrl}
      playVideoOnMobile={media.playVideoOnMobile}
    />
  )
}
