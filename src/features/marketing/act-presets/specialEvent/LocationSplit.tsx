import { useRef } from 'react'
import { previewSpecialEventFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { formatEventDate } from '../shared/actPresetUtils'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Split layout — location block + event details card. */
export function LocationSplitPreset({ row }: ActPresetProps) {
  const event = previewSpecialEventFields(row)
  const root = useRef<HTMLElement | null>(null)

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-location-split-left]', '[data-location-split-right]'],
    onAnimate: (host) => {
      const left = host.querySelector('[data-location-split-left]')
      const right = host.querySelector('[data-location-split-right]')
      gsap.set(left, { opacity: 0, x: -28 })
      gsap.set(right, { opacity: 0, x: 28 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        .to(left, { opacity: 1, x: 0, duration: 0.85, ease: 'power3.out' }, 0)
        .to(right, { opacity: 1, x: 0, duration: 0.85, ease: 'power3.out' }, 0.1)
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Event location"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 grid items-center gap-8 py-6 sm:gap-10 sm:py-8 lg:grid-cols-2">
        <div data-location-split-left>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {event.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--color-heading)]">
            {event.location || event.heading}
          </h2>
          {event.intro ? (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">{event.intro}</p>
          ) : null}
        </div>
        <div
          data-location-split-right
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/40 p-6 backdrop-blur-sm"
        >
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-heading)]">
            {event.eventTitle || event.heading}
          </h3>
          {event.startsAtIso ? (
            <p className="mt-4 text-sm text-[var(--color-text)]">
              {formatEventDate(event.startsAtIso)}
              {event.endsAtIso ? ` — ${formatEventDate(event.endsAtIso)}` : ''}
            </p>
          ) : null}
          {event.rules ? (
            <p className="mt-4 whitespace-pre-line text-xs leading-relaxed text-[var(--color-text-muted)]">
              {event.rules}
            </p>
          ) : null}
          {event.cta.label.trim() ? (
            <SafeLink
              data-act-micro
              href={event.cta.href}
              className="anvl-btn anvl-btn-primary mt-6 inline-flex"
            >
              {event.cta.label}
            </SafeLink>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
