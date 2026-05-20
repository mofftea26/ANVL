import { WaitlistSection } from '@/features/marketing/components/WaitlistSection'
import { previewWaitlistFields } from '@/features/cms/landing/landingActPreviewOverlay'
import type { ActPresetProps } from '../types'

/** Default waitlist — full-width oath form. */
export function OathFullWidthFormPreset({ landing, row, products, emblemSrc }: ActPresetProps) {
  return (
    <WaitlistSection
      content={previewWaitlistFields(landing.waitlist, row)}
      products={products}
      emblemSrc={emblemSrc}
    />
  )
}
