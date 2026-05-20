import { useRef } from 'react'
import { previewDropRevealFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Emblem-first drop reveal — crest leads, type follows. */
export function EmblemFirstRevealPreset({ landing, row, emblemSrc, products }: ActPresetProps) {
  const d = previewDropRevealFields(landing.dropReveal, row)
  const root = useRef<HTMLElement | null>(null)
  const stats =
    landing.dropReveal.stats.length > 0
      ? landing.dropReveal.stats
      : [
          { id: 's1', label: 'Pieces', value: String(products.length).padStart(2, '0') },
          { id: 's2', label: 'Edition', value: 'Numbered' },
        ]

  useActScrollReveal(root, {
    snapSelectors: ['[data-emblem-first-crest]', '[data-emblem-first-heading]', '[data-emblem-first-tag]'],
    onAnimate: (host) => {
      const crest = host.querySelector('[data-emblem-first-crest]')
      const heading = host.querySelector('[data-emblem-first-heading]')
      const tag = host.querySelector('[data-emblem-first-tag]')
      const statsEls = gsap.utils.toArray<HTMLElement>('[data-emblem-first-stat]', host)

      gsap.set(crest, { opacity: 0, scale: 0.75 })
      gsap.set([heading, tag, ...statsEls], { opacity: 0, y: 24 })

      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 75%', toggleActions: 'play none none reverse' },
        })
        .to(crest, { opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out' }, 0)
        .to(heading, { opacity: 1, y: 0, duration: 0.8 }, 0.2)
        .to(tag, { opacity: 1, y: 0, duration: 0.7 }, 0.35)
        .to(statsEls, { opacity: 1, y: 0, stagger: 0.08, duration: 0.6 }, 0.4)
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16"
      aria-label="Drop reveal"
    >
      <Container className="flex flex-col items-center text-center">
        <div data-emblem-first-crest className="mb-10">
          <DropEmblemDecor src={emblemSrc} className="h-36 w-36 md:h-48 md:w-48" alt="" />
        </div>
        <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {d.actLabel} · {d.counterLabel}
        </p>
        <h2
          data-emblem-first-heading
          className="anvl-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.9]"
        >
          {d.words.join(' ')}
        </h2>
        <p
          data-emblem-first-tag
          className="mt-6 max-w-lg text-sm text-[var(--color-text-muted)] md:text-base"
        >
          {d.tagline}
        </p>
        <dl className="mt-10 flex flex-wrap justify-center gap-8">
          {stats.map((stat) => (
            <div key={stat.id} data-emblem-first-stat className="text-center">
              <dt className="anvl-micro text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {stat.label}
              </dt>
              <dd className="mt-1 text-lg font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
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
