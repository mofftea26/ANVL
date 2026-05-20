import { useRef } from 'react'
import { previewSpecialEventFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

function formatEventDate(iso: string): string {
  if (!iso.trim()) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** Centered event card with date, location, and CTA. */
export function EventCardPreset({ row }: ActPresetProps) {
  const event = previewSpecialEventFields(row)
  const root = useRef<HTMLElement | null>(null)

  useActScrollReveal(root, {
    snapSelectors: ['[data-event-card]'],
    staggerSelector: '[data-event-card-line]',
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Special event"
    >
      <Container className="flex justify-center">
        <article
          data-event-card
          className="w-full max-w-xl rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center"
        >
          <p
            data-event-card-line
            className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {event.actLabel}
          </p>
          <h2
            data-event-card-line
            className="anvl-display text-[clamp(1.75rem,3.5vw,2.5rem)]"
          >
            {event.heading}
          </h2>
          {event.intro ? (
            <p
              data-event-card-line
              className="mt-4 text-sm text-[var(--color-text-muted)]"
            >
              {event.intro}
            </p>
          ) : null}
          {event.startsAtIso ? (
            <p data-event-card-line className="mt-6 text-sm font-medium">
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
            <p data-event-card-line className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {event.rules}
            </p>
          ) : null}
          {event.cta.label.trim() ? (
            <div data-event-card-line className="mt-8">
              <SafeLink href={event.cta.href} className="anvl-btn anvl-btn-primary">
                {event.cta.label}
              </SafeLink>
            </div>
          ) : null}
        </article>
      </Container>
    </section>
  )
}
