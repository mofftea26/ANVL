import { useRef } from 'react'
import { previewLookbookFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import { LookbookMedia } from './lookbookShared'

/** Default lookbook — masonry-style responsive grid. */
export function MasonryLookbookPreset({ row }: ActPresetProps) {
  const fields = previewLookbookFields(row)
  const root = useRef<HTMLElement | null>(null)

  useActScrollReveal(root, {
    staggerSelector: '[data-lookbook-tile]',
    snapSelectors: ['[data-lookbook-heading]', '[data-lookbook-intro]'],
  })

  if (fields.items.length === 0) {
    return <section aria-hidden="true" className="hidden" />
  }

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Lookbook"
    >
      <Container>
        <header className="mb-10 max-w-xl">
          <p
            data-lookbook-heading
            className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {fields.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)]">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
