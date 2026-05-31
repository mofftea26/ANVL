import { useRef } from 'react'
import { previewSpecialEventFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { formatEventDate } from '../shared/actPresetUtils'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Centered event card with date, location, and CTA. */
export function EventCardPreset({ row }: ActPresetProps) {
  const event = previewSpecialEventFields(row)
  const root = useRef<HTMLElement | null>(null)

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-event-card]'],
    staggerSelector: '[data-event-card-line]',
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Special event"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 flex flex-col items-center justify-center py-6 sm:py-8">
        <article
          data-event-card
          className="w-full max-w-xl rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/40 p-8 text-center backdrop-blur-sm"
        >
          <p
            data-event-card-line
            className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {event.actLabel}
          </p>
          <h2
            data-event-card-line
            className="anvl-display text-[clamp(1.75rem,3.5vw,2.5rem)] text-[var(--color-heading)]"
          >
            {event.heading}
          </h2>
          {event.intro ? (
            <p data-event-card-line className="mt-4 text-sm text-[var(--color-text-muted)]">
              {event.intro}
            </p>
          ) : null}
          {event.startsAtIso ? (
            <p data-event-card-line className="mt-6 text-sm font-medium text-[var(--color-text)]">
              {formatEventDate(event.startsAtIso)}
              {event.endsAtIso ? ` — ${formatEventDate(event.endsAtIso)}` : ''}
            </p>
          ) : null}
          {event.location ? (
            <p data-event-card-line className="mt-2 text-sm text-[var(--color-text-muted)]">
              {event.location}
            </p>
          ) : null}
          {event.rules ? (
            <p
              data-event-card-line
              className="mt-4 whitespace-pre-line text-xs leading-relaxed text-[var(--color-text-muted)]"
            >
              {event.rules}
            </p>
          ) : null}
          {event.cta.label.trim() ? (
            <div data-event-card-line className="mt-8">
              <SafeLink data-act-micro href={event.cta.href} className="anvl-btn anvl-btn-primary">
                {event.cta.label}
              </SafeLink>
            </div>
          ) : null}
        </article>
      </Container>
    </section>
  )
}
