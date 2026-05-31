import { useMemo, useRef } from 'react'
import { previewMaterialsFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Specs grid — compact material cards in a uniform grid. */
export function SpecsGridMaterialsPreset({ landing, row }: ActPresetProps) {
  const mat = previewMaterialsFields(landing.materials, row)
  const root = useRef<HTMLElement | null>(null)
  const visible = useMemo(
    () => mat.materials.filter((m) => m.isVisible !== false),
    [mat.materials],
  )

  useActPresetMotion(root, row, {
    staggerSelector: '[data-specs-card]',
    snapSelectors: ['[data-specs-heading]'],
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Materials"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 py-6 sm:py-8">
        <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {mat.actLabel}
        </p>
        <h2
          data-specs-heading
          className="anvl-display mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)] text-[var(--color-heading)]"
        >
          {mat.heading}
        </h2>
        <p className="mb-10 max-w-2xl whitespace-pre-line text-sm text-[var(--color-text-muted)]">
          {mat.intro}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((material) => (
            <article
              key={material.id}
              data-specs-card
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/20 p-5 backdrop-blur-sm"
            >
              <p className="font-semibold uppercase tracking-wide text-[var(--color-heading)]">
                {material.title}
              </p>
              <p className="mt-2 text-xs text-[var(--color-accent)]">{material.code}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {material.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
