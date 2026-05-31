import { useRef } from 'react'
import { previewSpecialEventFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { CountdownTiles, useLiveCountdown } from '../shared/LiveCountdown'
import { formatEventDate } from '../shared/actPresetUtils'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Event countdown — live tiles with location and CTA. */
export function CountdownEventPreset({ row }: ActPresetProps) {
  const event = previewSpecialEventFields(row)
  const root = useRef<HTMLElement | null>(null)
  const parts = useLiveCountdown(event.startsAtIso)

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-countdown-copy]', '[data-countdown-tiles]'],
    onAnimate: (host) => {
      const copy = host.querySelector('[data-countdown-copy]')
      const tiles = host.querySelector('[data-countdown-tiles]')
      gsap.set(copy, { opacity: 0, y: 24 })
      gsap.set(tiles, { opacity: 0, scale: 0.94 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        .to(copy, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, 0)
        .to(tiles, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }, 0.12)
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-surface)]"
      aria-label="Event countdown"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 flex flex-col justify-center py-6 text-center sm:py-8">
        <div data-countdown-copy>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {event.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--color-heading)]">
            {event.heading}
          </h2>
          {event.location ? (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{event.location}</p>
          ) : null}
          {event.startsAtIso ? (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {formatEventDate(event.startsAtIso)}
            </p>
          ) : null}
        </div>
        {parts ? (
          <div data-countdown-tiles className="mt-10 md:mx-auto md:max-w-xl">
            <CountdownTiles parts={parts} />
          </div>
        ) : null}
        {event.cta.label.trim() ? (
          <div className="mt-10">
            <SafeLink data-act-micro href={event.cta.href} className="anvl-btn anvl-btn-primary">
              {event.cta.label}
            </SafeLink>
          </div>
        ) : null}
      </Container>
    </section>
  )
}
