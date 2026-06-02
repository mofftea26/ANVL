import { useRef } from 'react'
import { DropRevealSection } from '@/features/marketing/components/DropRevealSection'
import { previewDropRevealFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { getActMotionTokens, resolveActAnimation } from '../shared/actAnimationConfig'
import { applyActMotionByType } from '../shared/actMotionHelpers'
import { CampaignMark } from '@/shared/components/brand/CampaignMark'
import type { ActPresetProps } from '../types'

export function OathMonolithRevealPreset({ landing, row, products, emblemSrc }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const d = previewDropRevealFields(landing.dropReveal, row)
  const animation = resolveActAnimation(row)

  useActPresetMotion(rootRef, row, { staggerSelector: '[data-reveal-word]' })

  useGSAP(
    () => {
      const host = rootRef.current
      if (!host) return
      const mm = gsap.matchMedia()
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const emblem = host.querySelector('[data-oath-emblem]')
        if (emblem) {
          gsap.fromTo(
            emblem,
            { scale: 0.6, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 1.2,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: host,
                start: 'top 70%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        }
        const tokens = getActMotionTokens(animation.intensity)
        return applyActMotionByType(host, animation, tokens, {
          blocks: '[data-reveal-block]',
          words: '[data-reveal-word]',
          floatTarget: '[data-oath-emblem]',
        })
      })
      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [animation.type, animation.intensity] },
  )

  return (
    <div ref={rootRef as React.RefObject<HTMLDivElement>} className="relative">
      <ActMediaBackdrop row={row} />
      {emblemSrc ? (
        <CampaignMark
          data-oath-emblem
          src={emblemSrc}
          onDark
          className="pointer-events-none absolute left-1/2 top-6 z-10 size-[var(--act-emblem-size)] -translate-x-1/2 opacity-80"
        />
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
