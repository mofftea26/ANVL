import { useRef } from 'react'
import { previewHeroFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Badge } from '@/shared/components/ui/Badge'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Centered emblem hero with staggered headline lines. */
export function MinimalEmblemHeroPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const hero = previewHeroFields(landing.hero, row)
  const root = useRef<HTMLElement | null>(null)
  const lines = hero.title.split(/\s+/).filter(Boolean)

  useActScrollReveal(root, {
    staggerSelector: '[data-minimal-line]',
    snapSelectors: ['[data-minimal-emblem]', '[data-minimal-sub]', '[data-minimal-ctas]'],
    onAnimate: (host) => {
      const emblem = host.querySelector('[data-minimal-emblem]')
      const sub = host.querySelector('[data-minimal-sub]')
      const ctas = host.querySelector('[data-minimal-ctas]')
      const linesEls = gsap.utils.toArray<HTMLElement>('[data-minimal-line]', host)

      gsap.set(emblem, { opacity: 0, scale: 0.82 })
      gsap.set(linesEls, { opacity: 0, y: 28 })
      gsap.set([sub, ctas], { opacity: 0, y: 16 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: host,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      })
      tl.to(emblem, { opacity: 1, scale: 1, duration: 1, ease: 'expo.out' }, 0)
        .to(linesEls, { opacity: 1, y: 0, stagger: 0.09, duration: 0.75, ease: 'power3.out' }, 0.12)
        .to(sub, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
        .to(ctas, { opacity: 1, y: 0, duration: 0.6 }, 0.45)
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section flex items-center border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Hero"
    >
      <Container className="flex min-h-[calc(100svh-var(--anvl-header-h))] flex-col items-center justify-center gap-8 py-16 text-center">
        <div data-minimal-emblem>
          <DropEmblemDecor src={emblemSrc} className="mx-auto h-28 w-28 md:h-36 md:w-36" alt="" />
        </div>
        <Badge>{hero.badgeText}</Badge>
        <h1 className="anvl-display max-w-3xl text-[clamp(2.25rem,5.5vw,4rem)] leading-[0.95]">
          {lines.map((line, i) => (
            <span key={`${line}-${i}`} data-minimal-line className="block">
              {line}
            </span>
          ))}
        </h1>
        <p
          data-minimal-sub
          className="max-w-lg text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base"
        >
          {hero.subtitle}
        </p>
        <div data-minimal-ctas className="flex flex-wrap justify-center gap-3">
          <SafeLink href={hero.primaryCta.href} className="anvl-btn anvl-btn-primary">
            {hero.primaryCta.label}
          </SafeLink>
          <SafeLink href={hero.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
            {hero.secondaryCta.label}
          </SafeLink>
        </div>
      </Container>
    </section>
  )
}
