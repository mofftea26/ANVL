import { OathStampSequence } from '@/features/marketing/components/OathStampSequence'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import type { ActPresetProps } from '../types'

/** Default manifesto — editorial oath stamp ledger. */
export function OathStampLedgerPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'manifesto')
  return (
    <div className="relative">
      <ActMediaBackdrop row={row} />
      <OathStampSequence
        actLabel={m.actLabel}
        counterLabel={m.counterLabel}
        heading={m.heading}
        intro={m.intro}
        tenets={m.tenets}
        emblemSrc={emblemSrc}
      />
    </div>
  )
}
