import { useRef } from 'react'
import { previewHeroFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Badge } from '@/shared/components/ui/Badge'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Split hero — copy left, emblem cutout right with parallax scrub. */
export function SplitProductHeroPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const hero = previewHeroFields(landing.hero, row)
  const root = useRef<HTMLElement | null>(null)
  const titleWords = hero.title.split(/\s+/).filter(Boolean)

  useActScrollReveal(root, {
    snapSelectors: [
      '[data-split-hero-copy]',
      '[data-split-hero-visual]',
      '[data-split-hero-word]',
    ],
    onAnimate: (host) => {
      const copy = host.querySelector('[data-split-hero-copy]')
      const visual = host.querySelector('[data-split-hero-visual]')
      const words = gsap.utils.toArray<HTMLElement>('[data-split-hero-word]', host)

      gsap.set([copy, visual], { opacity: 0, x: (i) => (i === 0 ? -40 : 40) })
      gsap.set(words, { opacity: 0, y: 24 })

      const intro = gsap.timeline({
        scrollTrigger: {
          trigger: host,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      })
      intro
        .to(copy, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, 0)
        .to(visual, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, 0.08)
        .to(words, { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: 'expo.out' }, 0.15)

      gsap.to(visual, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: host,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      })
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Hero"
    >
      <Container className="grid min-h-[calc(100svh-var(--anvl-header-h))] items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16">
        <div data-split-hero-copy className="flex flex-col gap-6">
          <Badge>{hero.badgeText}</Badge>
          <h1 className="anvl-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.92]">
            {titleWords.map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block overflow-hidden pr-[0.2em]">
                <span data-split-hero-word className="inline-block">
                  {word}
                </span>
              </span>
            ))}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
            {hero.subtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <SafeLink href={hero.primaryCta.href} className="anvl-btn anvl-btn-primary">
              {hero.primaryCta.label}
            </SafeLink>
            <SafeLink href={hero.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
              {hero.secondaryCta.label}
            </SafeLink>
          </div>
        </div>
        <div
          data-split-hero-visual
          className="relative flex items-center justify-center lg:justify-end"
        >
          <DropEmblemDecor
            src={emblemSrc}
            className="max-h-[min(52vh,28rem)] w-auto opacity-90"
            alt=""
          />
        </div>
      </Container>
    </section>
  )
}
