import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container } from '@/shared/components/ui/Container'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Image-led storytelling — emblem hero band + copy below. */
export function ImageLedStoryPreset({ landing, row, emblemSrc }: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'storytelling')
  const root = useRef<HTMLElement | null>(null)

  useActScrollReveal(root, {
    snapSelectors: ['[data-image-led-visual]', '[data-image-led-copy]'],
    staggerSelector: '[data-image-led-line]',
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Story"
    >
      <div
        data-image-led-visual
        className="flex min-h-[40vh] items-center justify-center border-b border-[var(--color-line)] bg-[var(--color-surface-soft)] py-12"
      >
        <DropEmblemDecor src={emblemSrc} className="h-32 w-32 md:h-44 md:w-44" alt="" />
      </div>
      <Container className="py-14 md:py-20">
        <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {m.actLabel}
        </p>
        <div data-image-led-copy>
          <h2 className="anvl-display mb-6 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight">
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
    </section>
  )
}
