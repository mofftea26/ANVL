import { useRef } from 'react'
import { previewDropRevealFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { CountdownTiles, useLiveCountdown } from '../shared/LiveCountdown'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Countdown trio reveal — live timer tiles with drop stats. */
export function CountdownTrioRevealPreset({ landing, row, products }: ActPresetProps) {
  const d = previewDropRevealFields(landing.dropReveal, row)
  const root = useRef<HTMLElement | null>(null)
  const countdownParts = useLiveCountdown(d.releaseDateIso)
  const trio = [
    { label: 'Drop', value: d.words.slice(0, 2).join(' ') || '01' },
    { label: 'Pieces', value: String(products.length).padStart(2, '0') },
    { label: 'Status', value: d.counterLabel || 'Soon' },
  ]

  useActPresetMotion(root, row, {
    staggerSelector: '[data-countdown-block]',
    snapSelectors: ['[data-countdown-heading]', '[data-countdown-tiles]', '[data-countdown-cta]'],
    onAnimate: (host) => {
      const tiles = host.querySelector('[data-countdown-tiles]')
      if (!tiles) return
      gsap.fromTo(
        tiles,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        },
      )
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Drop reveal"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 flex flex-col justify-center py-6 sm:py-8">
        <p className="anvl-micro mb-6 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {d.actLabel}
        </p>
        <h2
          data-countdown-heading
          className="anvl-display mb-8 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] leading-[0.92] text-[var(--color-heading)]"
        >
          {d.words.join(' ')}
        </h2>
        {countdownParts ? (
          <div data-countdown-tiles className="mb-10 max-w-xl">
            <CountdownTiles parts={countdownParts} />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          {trio.map((block) => (
            <div
              key={block.label}
              data-countdown-block
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/30 p-6 text-center backdrop-blur-sm"
            >
              <p className="anvl-micro text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {block.label}
              </p>
              <p className="anvl-display mt-2 text-2xl tabular-nums text-[var(--color-heading)] md:text-3xl">
                {block.value}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-xl text-sm text-[var(--color-text-muted)]">{d.tagline}</p>
        {d.primaryCta?.label?.trim() || d.secondaryCta?.label?.trim() ? (
          <div data-countdown-cta className="mt-8 flex flex-wrap gap-3">
            {d.primaryCta?.label?.trim() ? (
              <SafeLink data-act-micro href={d.primaryCta.href} className="anvl-btn anvl-btn-primary">
                {d.primaryCta.label}
              </SafeLink>
            ) : null}
            {d.secondaryCta?.label?.trim() ? (
              <SafeLink data-act-micro href={d.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
                {d.secondaryCta.label}
              </SafeLink>
            ) : null}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
