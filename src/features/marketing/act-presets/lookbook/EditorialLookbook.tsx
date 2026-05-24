import { useRef } from 'react'
import { previewLookbookFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import { LookbookMedia } from './lookbookShared'

/** Editorial lookbook — hero frame plus supporting tiles. */
export function EditorialLookbookPreset({ row }: ActPresetProps) {
  const fields = previewLookbookFields(row)
  const root = useRef<HTMLElement | null>(null)
  const [hero, ...rest] = fields.items

  useActScrollReveal(root, {
    snapSelectors: ['[data-lookbook-editorial-copy]', '[data-lookbook-editorial-hero]', '[data-lookbook-editorial-thumb]'],
    onAnimate: (host) => {
      const copy = host.querySelector('[data-lookbook-editorial-copy]')
      const heroEl = host.querySelector('[data-lookbook-editorial-hero]')
      const thumbs = gsap.utils.toArray<HTMLElement>('[data-lookbook-editorial-thumb]', host)
      gsap.set([copy, heroEl], { opacity: 0, y: 32 })
      gsap.set(thumbs, { opacity: 0, y: 20 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 75%', toggleActions: 'play none none reverse' },
        })
        .to(copy, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0)
        .to(heroEl, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.1)
        .to(thumbs, { opacity: 1, y: 0, stagger: 0.08, duration: 0.65, ease: 'power3.out' }, 0.25)
    },
  })

  if (!hero) {
    return <section aria-hidden="true" className="hidden" />
  }

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-surface)] py-16 md:py-24"
      aria-label="Editorial lookbook"
    >
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div data-lookbook-editorial-copy>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {fields.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)]">
            {fields.heading}
          </h2>
          {fields.intro ? (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {fields.intro}
            </p>
          ) : null}
        </div>
        <div className="space-y-4">
          <figure
            data-lookbook-editorial-hero
            className="overflow-hidden rounded-lg border border-[var(--color-line)]"
          >
            <LookbookMedia item={hero} className="aspect-[4/5] w-full object-cover" />
            {hero.caption ? (
              <figcaption className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                {hero.caption}
              </figcaption>
            ) : null}
          </figure>
          {rest.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {rest.slice(0, 3).map((item, i) => (
                <figure
                  key={`${item.src}-${i}`}
                  data-lookbook-editorial-thumb
                  className="overflow-hidden rounded-md border border-[var(--color-line)]"
                >
                  <LookbookMedia item={item} className="aspect-square w-full object-cover" />
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
