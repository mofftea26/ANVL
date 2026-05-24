import { DropRevealSection } from '@/features/marketing/components/DropRevealSection'
import { previewDropRevealFields } from '@/features/cms/landing/landingActPreviewOverlay'
import type { ActPresetProps } from '../types'

/** Default drop reveal — typographic monolith. */
export function MonolithRevealPreset({ landing, row, products }: ActPresetProps) {
  const d = previewDropRevealFields(landing.dropReveal, row)
  return (
    <DropRevealSection
      products={products}
      actLabel={d.actLabel}
      counterLabel={d.counterLabel}
      words={d.words}
      tagline={d.tagline}
      stats={landing.dropReveal.stats}
      primaryCta={d.primaryCta}
      secondaryCta={d.secondaryCta}
      dropIcon={d.dropIcon}
    />
  )
}
