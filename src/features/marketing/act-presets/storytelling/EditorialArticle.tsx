import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Editorial article storytelling — long-form single column. */
export function EditorialArticlePreset({ landing, row }: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'storytelling')
  const root = useRef<HTMLElement | null>(null)
  const paragraphs = m.intro.split(/\n\n+/).filter(Boolean)

  useActScrollReveal(root, {
    staggerSelector: '[data-editorial-block]',
    snapSelectors: ['[data-editorial-eyebrow]', '[data-editorial-heading]'],
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Story"
    >
      <Container className="mx-auto max-w-3xl">
        <p
          data-editorial-eyebrow
          className="anvl-micro mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
        >
          {m.actLabel}
        </p>
        <h2
          data-editorial-heading
          className="anvl-display mb-10 text-[clamp(2rem,4vw,3rem)] leading-[0.95]"
        >
          {m.heading}
        </h2>
        <div className="space-y-6 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
          {paragraphs.map((p, i) => (
            <p key={i} data-editorial-block>
              {p}
            </p>
          ))}
        </div>
      </Container>
    </section>
  )
}
