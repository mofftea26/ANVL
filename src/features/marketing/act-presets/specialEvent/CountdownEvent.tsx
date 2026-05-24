import { useMemo, useRef } from 'react'
import { previewSpecialEventFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

function countdownParts(targetIso: string): { days: number; hours: number; minutes: number } | null {
  const target = new Date(targetIso).getTime()
  if (Number.isNaN(target)) return null
  const diff = Math.max(0, target - Date.now())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  return { days, hours, minutes }
}

/** Event countdown trio — days / hours / minutes. */
export function CountdownEventPreset({ row }: ActPresetProps) {
  const event = previewSpecialEventFields(row)
  const root = useRef<HTMLElement | null>(null)
  const parts = useMemo(
    () => (event.startsAtIso ? countdownParts(event.startsAtIso) : null),
    [event.startsAtIso],
  )

  useActScrollReveal(root, {
    snapSelectors: ['[data-countdown-copy]', '[data-countdown-tile]'],
    onAnimate: (host) => {
      const copy = host.querySelector('[data-countdown-copy]')
      const tiles = gsap.utils.toArray<HTMLElement>('[data-countdown-tile]', host)
      gsap.set(copy, { opacity: 0, y: 24 })
      gsap.set(tiles, { opacity: 0, scale: 0.92 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        .to(copy, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, 0)
        .to(tiles, { opacity: 1, scale: 1, stagger: 0.1, duration: 0.7, ease: 'back.out(1.4)' }, 0.12)
    },
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-surface)] py-16 md:py-24"
      aria-label="Event countdown"
    >
      <Container className="text-center">
        <div data-countdown-copy>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {event.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)]">
            {event.heading}
          </h2>
          {event.location ? (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{event.location}</p>
          ) : null}
        </div>
        {parts ? (
          <div className="mt-10 grid grid-cols-3 gap-4 md:mx-auto md:max-w-lg">
            {(
              [
                ['Days', parts.days],
                ['Hours', parts.hours],
                ['Minutes', parts.minutes],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                data-countdown-tile
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-6"
              >
                <p className="anvl-display text-3xl md:text-4xl">{value}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        {event.cta.label.trim() ? (
          <div className="mt-10">
            <SafeLink href={event.cta.href} className="anvl-btn anvl-btn-primary">
              {event.cta.label}
            </SafeLink>
          </div>
        ) : null}
      </Container>
    </section>
  )
}
