import { OathStampSequence } from '@/features/marketing/components/OathStampSequence'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import type { ActPresetProps } from '../types'

/** Default storytelling — chapter scroll via oath stamp sequence. */
export function ChapterScrollPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'storytelling')
  return (
    <OathStampSequence
      actLabel={m.actLabel}
      counterLabel={m.counterLabel}
      heading={m.heading}
      intro={m.intro}
      tenets={m.tenets}
      emblemSrc={emblemSrc}
    />
  )
}
