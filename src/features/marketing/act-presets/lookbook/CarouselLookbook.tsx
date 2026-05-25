import { useRef } from 'react'
import { previewLookbookFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import { LookbookMedia } from './lookbookShared'

/** Horizontal scrub gallery on desktop; scroll row on mobile. */
export function CarouselLookbookPreset({ row }: ActPresetProps) {
  const fields = previewLookbookFields(row)
  const root = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  useActScrollReveal(root, {
    snapSelectors: ['[data-lookbook-carousel-heading]', '[data-lookbook-carousel-tile]'],
    onAnimate: (host) => {
      const track = trackRef.current
      if (!track || fields.items.length < 2) return

      const tiles = gsap.utils.toArray<HTMLElement>('[data-lookbook-carousel-tile]', host)
      gsap.set(tiles, { opacity: 0, x: 40 })
      gsap.to(tiles, {
        opacity: 1,
        x: 0,
        stagger: 0.08,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: host,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      })

      const scrollWidth = track.scrollWidth - track.clientWidth
      if (scrollWidth <= 0) return

      gsap.to(track, {
        x: () => -scrollWidth,
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

  if (fields.items.length === 0) {
    return <section aria-hidden="true" className="hidden" />
  }

  return (
    <section
      ref={root}
      className="overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Lookbook carousel"
    >
      <Container>
        <header className="mb-8 max-w-xl">
          <p
            data-lookbook-carousel-heading
            className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {fields.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)]">
            {fields.heading}
          </h2>
          {fields.intro ? (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">{fields.intro}</p>
          ) : null}
        </header>
      </Container>
      <div
        ref={trackRef}
        className="flex w-max max-w-none gap-4 px-[max(1rem,calc((100%-min(100%,80rem))/2))] pr-6 md:px-8"
      >
        {fields.items.map((item, i) => (
          <figure
            key={`${item.src}-${i}`}
            data-lookbook-carousel-tile
            className="w-[min(min(72vw,100%-2rem),20rem)] shrink-0 overflow-hidden rounded-lg border border-[var(--color-line)]"
          >
            <LookbookMedia
              item={item}
              className="aspect-[3/4] w-full object-cover"
            />
            {item.caption ? (
              <figcaption className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  )
}
