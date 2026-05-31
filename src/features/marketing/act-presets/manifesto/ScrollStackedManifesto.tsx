import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { formatTenetLine } from '../shared/actPresetUtils'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Scroll-stacked manifesto — pinned panels with scrubbed copy reveals. */
export function ScrollStackedManifestoPreset({ landing, row }: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'manifesto')
  const root = useRef<HTMLElement | null>(null)
  const visibleTenets = m.tenets.filter((t) => t.isVisible !== false)
  const introBlocks = m.intro.split(/\n\n+/).filter(Boolean)
  const blocks = introBlocks.length ? introBlocks : [m.intro]

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-stack-panel]', '[data-stack-heading]', '[data-stack-tenet]'],
    onAnimate: (host, ctx) => {
      const tokens = ctx?.tokens
      const scrub = tokens?.scrub ?? 0.55
      const panels = gsap.utils.toArray<HTMLElement>('[data-stack-panel]', host)

      panels.forEach((panel, index) => {
        const heading = panel.querySelector('[data-stack-heading]')
        const body = panel.querySelector('[data-stack-body]')
        const tenets = gsap.utils.toArray<HTMLElement>('[data-stack-tenet]', panel)

        gsap.set([heading, body, ...tenets], { opacity: 0, y: (tokens?.enterY ?? 32) * 0.55 })

        gsap
          .timeline({
            scrollTrigger: {
              trigger: panel,
              start: 'top 72%',
              end: 'bottom 35%',
              scrub,
            },
          })
          .to(heading, { opacity: 1, y: 0, duration: 0.35 }, 0)
          .to(body, { opacity: 1, y: 0, duration: 0.3 }, 0.12)
          .to(tenets, { opacity: 1, y: 0, stagger: 0.07, duration: 0.28 }, 0.2)

        if (index < panels.length - 1) {
          gsap.to(panel, {
            scale: 0.97,
            opacity: 0.45,
            ease: 'none',
            scrollTrigger: {
              trigger: panels[index + 1],
              start: 'top bottom',
              end: 'top 45%',
              scrub: true,
            },
          })
        }
      })
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Manifesto"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 flex flex-col justify-center py-6 sm:py-8">
        <p className="anvl-micro mb-8 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {m.actLabel} · {m.counterLabel}
        </p>
        <div className="space-y-8 md:space-y-10">
          {blocks.map((block, i) => (
            <article
              key={`stack-${i}`}
              data-stack-panel
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/25 p-6 backdrop-blur-sm md:p-9"
            >
              {i === 0 ? (
                <h2
                  data-stack-heading
                  className="anvl-display mb-5 text-[clamp(1.85rem,4vw,3rem)] leading-[0.94] text-[var(--color-heading)]"
                >
                  {m.heading}
                </h2>
              ) : (
                <h3
                  data-stack-heading
                  className="anvl-micro mb-4 text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]"
                >
                  Part {String(i + 1).padStart(2, '0')}
                </h3>
              )}
              <p
                data-stack-body
                className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base"
              >
                {block}
              </p>
              {i === blocks.length - 1 && visibleTenets.length > 0 ? (
                <ul className="mt-8 space-y-3 border-t border-[var(--color-line)] pt-6">
                  {visibleTenets.map((tenet) => (
                    <li
                      key={tenet.id}
                      data-stack-tenet
                      className="flex gap-3 text-sm text-[var(--color-text)]"
                    >
                      <span className="text-[var(--color-accent)]" aria-hidden>
                        —
                      </span>
                      <span>{formatTenetLine(tenet as { label?: string; body?: string; text?: string })}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
