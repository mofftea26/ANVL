import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { applyCalmIdleFloat } from '../shared/actMotionHelpers'
import { formatTenetLine } from '../shared/actPresetUtils'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Split manifesto — editorial ledger with animated tenet rail. */
export function SplitTextManifestoPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'manifesto')
  const root = useRef<HTMLElement | null>(null)
  const visibleTenets = m.tenets.filter((t) => t.isVisible !== false)
  const headingWords = m.heading.split(/\s+/).filter(Boolean)

  useActPresetMotion(root, row, {
    snapSelectors: [
      '[data-split-manifesto-eyebrow]',
      '[data-split-manifesto-word]',
      '[data-split-manifesto-intro]',
      '[data-split-manifesto-tenet]',
      '[data-split-manifesto-emblem]',
    ],
    onAnimate: (host, ctx) => {
      const tokens = ctx?.tokens
      const eyebrow = host.querySelector('[data-split-manifesto-eyebrow]')
      const words = gsap.utils.toArray<HTMLElement>('[data-split-manifesto-word]', host)
      const intro = host.querySelector('[data-split-manifesto-intro]')
      const tenets = gsap.utils.toArray<HTMLElement>('[data-split-manifesto-tenet]', host)
      const emblem = host.querySelector('[data-split-manifesto-emblem]')
      const enterY = tokens?.enterY ?? 24
      const enterX = tokens?.enterX ?? 28

      gsap.set([eyebrow, intro, emblem], { opacity: 0, y: enterY * 0.6 })
      gsap.set(words, { opacity: 0, x: -enterX * 0.8 })
      gsap.set(tenets, { opacity: 0, x: enterX * 0.8 })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: host,
            start: 'top 72%',
            toggleActions: 'play none none reverse',
          },
        })
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.55 }, 0)
        .to(words, { opacity: 1, x: 0, stagger: 0.06, duration: 0.65, ease: 'power3.out' }, 0.06)
        .to(intro, { opacity: 1, y: 0, duration: 0.7 }, 0.22)
        .to(tenets, { opacity: 1, x: 0, stagger: 0.09, duration: 0.6, ease: 'power3.out' }, 0.18)
        .to(emblem, { opacity: 0.4, y: 0, duration: 1 }, 0.12)

      gsap.to(emblem, {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: host,
          start: 'top bottom',
          end: 'bottom top',
          scrub: tokens?.scrub ?? 0.5,
        },
      })

      return applyCalmIdleFloat(emblem, tokens ?? { duration: 0.85, stagger: 0.1, enterY: 36, enterX: 28, scrub: 0.6, parallaxY: 12 }, 'subtle')
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Manifesto"
    >
      <ActMediaBackdrop row={row} />
      <div
        data-split-manifesto-emblem
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] opacity-0 lg:block"
        aria-hidden
      >
        <DropEmblemDecor
          src={emblemSrc}
          className="absolute right-[-5%] top-1/2 h-[min(72vh,30rem)] w-auto -translate-y-1/2"
          alt=""
        />
      </div>
      <Container className="anvl-act-content relative z-10 grid items-start gap-8 py-6 sm:gap-12 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p
            data-split-manifesto-eyebrow
            className="anvl-micro mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {m.actLabel}
            {m.counterLabel ? ` · ${m.counterLabel}` : ''}
          </p>
          <h2 className="anvl-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[0.94] text-[var(--color-heading)]">
            {headingWords.map((word, i) => (
              <span key={`${word}-${i}`} className="mr-[0.25em] inline-block overflow-hidden">
                <span data-split-manifesto-word className="inline-block">
                  {word}
                </span>
              </span>
            ))}
          </h2>
          <p
            data-split-manifesto-intro
            className="mt-6 max-w-prose whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base"
          >
            {m.intro}
          </p>
        </div>
        <ol className="space-y-0 border border-[var(--color-line)]/80 bg-[var(--color-surface)]/20 backdrop-blur-sm lg:rounded-xl">
          {visibleTenets.map((tenet, i) => (
            <li
              key={tenet.id}
              data-split-manifesto-tenet
              className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-[var(--color-line)]/70 px-4 py-5 last:border-b-0 md:px-5"
            >
              <span className="anvl-micro pt-0.5 text-[10px] text-[var(--color-accent)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-sm leading-relaxed text-[var(--color-text)]">
                {formatTenetLine(tenet as { label?: string; body?: string; text?: string })}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
