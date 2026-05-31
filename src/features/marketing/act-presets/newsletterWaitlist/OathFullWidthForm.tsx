import { WaitlistSection } from '@/features/marketing/components/WaitlistSection'
import { previewWaitlistFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import type { ActPresetProps } from '../types'

/** Default waitlist — full-width oath form. */
export function OathFullWidthFormPreset({ landing, row, products, emblemSrc }: ActPresetProps) {
  return (
    <div className="relative">
      <ActMediaBackdrop row={row} />
      <WaitlistSection
        content={previewWaitlistFields(landing.waitlist, row)}
        products={products}
        emblemSrc={emblemSrc}
      />
    </div>
  )
}
