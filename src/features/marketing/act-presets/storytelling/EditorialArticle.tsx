import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Editorial article storytelling — refined long-form column with drop cap rhythm. */
export function EditorialArticlePreset({ landing, row }: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'storytelling')
  const root = useRef<HTMLElement | null>(null)
  const paragraphs = m.intro.split(/\n\n+/).filter(Boolean)

  useActPresetMotion(root, row, {
    staggerSelector: '[data-editorial-block]',
    snapSelectors: ['[data-editorial-eyebrow]', '[data-editorial-heading]', '[data-editorial-rule]'],
    onAnimate: (host, ctx) => {
      const rule = host.querySelector('[data-editorial-rule]')
      gsap.fromTo(
        rule,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 0.9,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        },
      )
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Story"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 mx-auto flex max-w-3xl flex-col justify-center px-4 py-6 sm:py-8">
        <p
          data-editorial-eyebrow
          className="anvl-micro mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
        >
          {m.actLabel}
        </p>
        <h2
          data-editorial-heading
          className="anvl-display mb-6 text-[clamp(2rem,4vw,3rem)] leading-[0.94] text-[var(--color-heading)]"
        >
          {m.heading}
        </h2>
        <div
          data-editorial-rule
          className="mb-10 h-px w-24 bg-[var(--color-accent)]"
          aria-hidden
        />
        <div className="space-y-6 text-sm leading-[1.75] text-[var(--color-text-muted)] md:text-base">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              data-editorial-block
              className={i === 0 ? 'first-letter:float-left first-letter:mr-3 first-letter:text-4xl first-letter:font-normal first-letter:text-[var(--color-heading)]' : undefined}
            >
              {p}
            </p>
          ))}
        </div>
      </Container>
    </section>
  )
}
