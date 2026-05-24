import { useMemo, useRef } from 'react'
import { previewMaterialsFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Specs grid — compact material cards in a uniform grid. */
export function SpecsGridMaterialsPreset({ landing, row }: ActPresetProps) {
  const mat = previewMaterialsFields(landing.materials, row)
  const root = useRef<HTMLElement | null>(null)
  const visible = useMemo(
    () => mat.materials.filter((m) => m.isVisible !== false),
    [mat.materials],
  )

  useActScrollReveal(root, {
    staggerSelector: '[data-specs-card]',
    snapSelectors: ['[data-specs-heading]'],
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-14 md:py-20"
      aria-label="Materials"
    >
      <Container>
        <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {mat.actLabel}
        </p>
        <h2 data-specs-heading className="anvl-display mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)]">
          {mat.heading}
        </h2>
        <p className="mb-10 max-w-2xl text-sm text-[var(--color-text-muted)]">{mat.intro}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((material) => (
            <article
              key={material.id}
              data-specs-card
              className="rounded-lg border border-[var(--color-line)] p-5"
            >
              <p className="font-semibold uppercase tracking-wide">{material.title}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">{material.code}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{material.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
