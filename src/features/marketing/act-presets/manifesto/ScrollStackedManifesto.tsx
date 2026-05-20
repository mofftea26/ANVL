import { OathStampSequence } from '@/features/marketing/components/OathStampSequence'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import type { ActPresetProps } from '../types'

/** Scroll-stacked manifesto variant — reuses oath stamp motion for now. */
export function ScrollStackedManifestoPreset(props: ActPresetProps) {
  const m = previewManifestoFields(props.landing.manifesto, props.row, 'manifesto')
  return (
    <OathStampSequence
      actLabel={m.actLabel}
      counterLabel={m.counterLabel}
      heading={m.heading}
      intro={m.intro}
      tenets={m.tenets}
      emblemSrc={props.emblemSrc}
    />
  )
}
