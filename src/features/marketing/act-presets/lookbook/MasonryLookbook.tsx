import { useRef } from 'react'
import { previewLookbookFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import { LookbookMedia } from './lookbookShared'

/** Default lookbook — masonry-style responsive grid. */
export function MasonryLookbookPreset({ row }: ActPresetProps) {
  const fields = previewLookbookFields(row)
  const root = useRef<HTMLElement | null>(null)

  useActPresetMotion(root, row, {
    staggerSelector: '[data-lookbook-tile]',
    snapSelectors: ['[data-lookbook-heading]', '[data-lookbook-intro]'],
  })

  if (fields.items.length === 0) {
    return <section aria-hidden="true" className="hidden" />
  }

  return (
    <section
      ref={root}
      className="anvl-screen-section anvl-act-section--tall relative overflow-visible border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Lookbook"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 flex flex-col justify-center py-8 sm:py-10">
        <header className="mb-8 max-w-xl sm:mb-10">
          <p
            data-lookbook-heading
            className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {fields.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--color-heading)]">
            {fields.heading}
          </h2>
          {fields.intro ? (
            <p
              data-lookbook-intro
              className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]"
            >
              {fields.intro}
            </p>
          ) : null}
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {fields.items.map((item, i) => (
            <figure
              key={`${item.src}-${i}`}
              data-lookbook-tile
              className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]"
            >
              <LookbookMedia
                item={item}
                className="aspect-[4/5] h-full w-full object-cover"
              />
              {item.caption ? (
                <figcaption className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}
