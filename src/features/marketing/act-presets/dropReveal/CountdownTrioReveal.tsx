import { useRef } from 'react'
import { previewDropRevealFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Countdown-style trio — three stat blocks with stagger entrance. */
export function CountdownTrioRevealPreset({ landing, row, products }: ActPresetProps) {
  const d = previewDropRevealFields(landing.dropReveal, row)
  const root = useRef<HTMLElement | null>(null)
  const trio = [
    { label: 'Drop', value: d.words.slice(0, 2).join(' ') || '01' },
    { label: 'Pieces', value: String(products.length).padStart(2, '0') },
    { label: 'Status', value: d.counterLabel || 'Soon' },
  ]

  useActScrollReveal(root, {
    staggerSelector: '[data-countdown-block]',
    snapSelectors: ['[data-countdown-heading]', '[data-countdown-cta]'],
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Drop reveal"
    >
      <Container>
        <p className="anvl-micro mb-6 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {d.actLabel}
        </p>
        <h2
          data-countdown-heading
          className="anvl-display mb-12 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] leading-[0.92]"
        >
          {d.words.join(' ')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {trio.map((block) => (
            <div
              key={block.label}
              data-countdown-block
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] p-6 text-center"
            >
              <p className="anvl-micro text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {block.label}
              </p>
              <p className="mt-2 text-2xl font-semibold md:text-3xl">{block.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-xl text-sm text-[var(--color-text-muted)]">{d.tagline}</p>
        <div data-countdown-cta className="mt-8 flex flex-wrap gap-3">
          <SafeLink href={d.primaryCta.href} className="anvl-btn anvl-btn-primary">
            {d.primaryCta.label}
          </SafeLink>
          <SafeLink href={d.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
            {d.secondaryCta.label}
          </SafeLink>
        </div>
      </Container>
    </section>
  )
}
