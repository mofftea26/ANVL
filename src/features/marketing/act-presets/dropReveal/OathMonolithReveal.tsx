import { useRef, type RefObject } from 'react'
import { DropRevealSection } from '@/features/marketing/components/DropRevealSection'
import { previewDropRevealFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { CampaignMark } from '@/shared/components/brand/CampaignMark'
import type { ActPresetProps } from '../types'

export function OathMonolithRevealPreset({ landing, row, products, emblemSrc }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const d = previewDropRevealFields(landing.dropReveal, row)

  useActPresetMotion(rootRef, row, { staggerSelector: '[data-reveal-word]' })

  return (
    <div ref={rootRef as RefObject<HTMLDivElement>} className="relative">
      <ActMediaBackdrop row={row} />
      {emblemSrc ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
        >
          <CampaignMark
            data-oath-emblem
            src={emblemSrc}
            onDark
            className="size-[min(72vw,22rem)] max-w-none opacity-[0.045] blur-[0.5px] sm:size-[min(58vw,20rem)] md:size-[min(44vw,18rem)]"
          />
        </div>
      ) : null}
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
    </div>
  )
}
