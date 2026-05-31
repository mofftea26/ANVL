import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { resolveProductShowcaseProducts } from '../resolveProductShowcaseProducts'
import type { ActPresetProps } from '../types'

/** Horizontal product carousel — snap scroll on mobile, scrub on desktop. */
export function ProductCarouselPreset({ landing, row, products }: ActPresetProps) {
  const p = previewPiecesFields(landing.pieces, row)
  const showcaseProducts = resolveProductShowcaseProducts(products, row?.productIds)
  const root = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  useActPresetMotion(root, row, {
    staggerSelector: '[data-carousel-card]',
    snapSelectors: ['[data-carousel-heading]'],
    onAnimate: (host) => {
      const track = trackRef.current
      if (!track || showcaseProducts.length < 2) return
      const scrollWidth = track.scrollWidth - track.clientWidth
      if (scrollWidth <= 0) return
      gsap.to(track, {
        x: () => -scrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: host,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.55,
        },
      })
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Products"
    >
      <ActMediaBackdrop row={row} />
      <div className="anvl-act-content relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-6 py-6 sm:py-8">
        <Container>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {p.actLabel}
          </p>
          <h2
            data-carousel-heading
            className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--color-heading)]"
          >
            {p.headingLineOne}{' '}
            <span className="text-[var(--color-text-muted)]">{p.headingLineTwo}</span>
          </h2>
        </Container>
        <div className="min-h-0 shrink overflow-x-auto pb-1 md:overflow-hidden">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 px-[max(1rem,calc((100vw-72rem)/2+1rem))] md:snap-none"
          >
          {showcaseProducts.map((product) => (
            <Link
              key={product.id}
              to="/shop/$slug"
              params={{ slug: product.slug }}
              data-carousel-card
              data-act-micro
              className="w-56 shrink-0 snap-start rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/25 p-3 backdrop-blur-sm transition-colors hover:border-[var(--color-accent)]"
            >
              <div className="aspect-[4/5] overflow-hidden rounded bg-[var(--color-line)]">
                {product.images[0]?.src ? (
                  <img
                    src={product.images[0].src}
                    alt={product.name}
                    width={224}
                    height={280}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--color-heading)]">{product.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">${product.price}</p>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
