import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { ActVisualFrame } from '../shared/ActVisualFrame'
import { applyCalmIdlePulse } from '../shared/actMotionHelpers'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Image-led storytelling — full-bleed act media band + editorial copy. */
export function ImageLedStoryPreset({ landing, row, emblemSrc }: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'storytelling')
  const root = useRef<HTMLElement | null>(null)
  const hasMedia = Boolean(row?.media?.imageUrl || row?.media?.videoUrl)

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-image-led-visual]', '[data-image-led-copy]'],
    staggerSelector: '[data-image-led-line]',
    onAnimate: (host, ctx) => {
      const visual = host.querySelector('[data-image-led-visual]')
      const copy = host.querySelector('[data-image-led-copy]')
      gsap.set(visual, { opacity: 0, scale: 1.04 })
      gsap.set(copy, { opacity: 0, y: ctx?.tokens?.enterY ?? 28 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 80%', toggleActions: 'play none none reverse' },
        })
        .to(visual, { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' }, 0)
        .to(copy, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.15)

      const emblem = host.querySelector('[data-image-led-emblem]')
      return applyCalmIdlePulse(emblem, 'subtle')
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Story"
    >
      <ActMediaBackdrop row={row} />
      <div className="anvl-act-content relative z-10 flex min-h-0 flex-1 flex-col">
        <div
          data-image-led-visual
          className="relative flex min-h-0 flex-[0.45] items-center justify-center overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-surface-soft)]"
        >
          {hasMedia ? (
            <ActVisualFrame
              row={row}
              className="absolute inset-0"
              mediaClassName="h-full w-full object-cover opacity-80"
              overlayClassName="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/25 to-[var(--color-bg)]/10"
            />
          ) : null}
          <div className="relative z-10 flex items-center justify-center py-6">
            <div data-image-led-emblem>
              <DropEmblemDecor
                src={emblemSrc}
                className="h-24 w-24 md:h-32 md:w-32"
                alt=""
              />
            </div>
          </div>
        </div>
        <Container className="flex min-h-0 flex-1 flex-col justify-center py-6 sm:py-8">
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {m.actLabel}
          </p>
          <div data-image-led-copy>
            <h2 className="anvl-display mb-6 max-w-3xl text-[clamp(1.85rem,3.8vw,2.85rem)] leading-[0.95] text-[var(--color-heading)]">
              {m.heading.split(/\s+/).map((word, i) => (
                <span key={`${word}-${i}`} data-image-led-line className="mr-[0.2em] inline-block">
                  {word}
                </span>
              ))}
            </h2>
            <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
              {m.intro}
            </p>
          </div>
        </Container>
      </div>
    </section>
  )
}
