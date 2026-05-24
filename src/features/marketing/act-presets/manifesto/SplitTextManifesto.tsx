import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Split manifesto — heading + intro left, numbered tenets right. */
export function SplitTextManifestoPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'manifesto')
  const root = useRef<HTMLElement | null>(null)
  const visibleTenets = m.tenets.filter((t) => t.isVisible !== false)
  const headingWords = m.heading.split(/\s+/).filter(Boolean)

  useActScrollReveal(root, {
    snapSelectors: [
      '[data-split-manifesto-eyebrow]',
      '[data-split-manifesto-word]',
      '[data-split-manifesto-intro]',
      '[data-split-manifesto-tenet]',
      '[data-split-manifesto-emblem]',
    ],
    onAnimate: (host) => {
      const eyebrow = host.querySelector('[data-split-manifesto-eyebrow]')
      const words = gsap.utils.toArray<HTMLElement>('[data-split-manifesto-word]', host)
      const intro = host.querySelector('[data-split-manifesto-intro]')
      const tenets = gsap.utils.toArray<HTMLElement>('[data-split-manifesto-tenet]', host)
      const emblem = host.querySelector('[data-split-manifesto-emblem]')

      gsap.set([eyebrow, intro, emblem], { opacity: 0, y: 20 })
      gsap.set(words, { opacity: 0, x: -24 })
      gsap.set(tenets, { opacity: 0, x: 32 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: host,
          start: 'top 72%',
          toggleActions: 'play none none reverse',
        },
      })
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0)
        .to(words, { opacity: 1, x: 0, stagger: 0.06, duration: 0.65, ease: 'power3.out' }, 0.08)
        .to(intro, { opacity: 1, y: 0, duration: 0.7 }, 0.25)
        .to(tenets, { opacity: 1, x: 0, stagger: 0.1, duration: 0.65, ease: 'power3.out' }, 0.2)
        .to(emblem, { opacity: 0.35, y: 0, duration: 1.1, ease: 'sine.out' }, 0.15)

      gsap.to(emblem, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: host,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      })
    },
  })

  return (
    <section
      ref={root}
      className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Manifesto"
    >
      <div
        data-split-manifesto-emblem
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-0 lg:block"
        aria-hidden
      >
        <DropEmblemDecor
          src={emblemSrc}
          className="absolute right-0 top-1/2 h-[min(70vh,32rem)] w-auto -translate-y-1/2 opacity-40"
          alt=""
        />
      </div>
      <Container className="relative grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p
            data-split-manifesto-eyebrow
            className="anvl-micro mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {m.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[0.95]">
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
        <ol className="space-y-6 border-t border-[var(--color-line)] pt-8 lg:border-t-0 lg:pt-0">
          {visibleTenets.map((tenet, i) => (
            <li
              key={tenet.id}
              data-split-manifesto-tenet
              className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--color-line)] pb-6 last:border-b-0"
            >
              <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-sm leading-relaxed text-[var(--color-text)]">{tenet.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
