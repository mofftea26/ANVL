import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import { resolveProductShowcaseProducts } from '../resolveProductShowcaseProducts'
import type { ActPresetProps } from '../types'

/** Horizontal product carousel strip (static scroll on mobile). */
export function ProductCarouselPreset({ landing, row, products }: ActPresetProps) {
  const p = previewPiecesFields(landing.pieces, row)
  const showcaseProducts = resolveProductShowcaseProducts(products, row?.productIds)
  const root = useRef<HTMLElement | null>(null)

  useActScrollReveal(root, {
    staggerSelector: '[data-carousel-card]',
    snapSelectors: ['[data-carousel-heading]'],
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-14 md:py-20"
      aria-label="Products"
    >
      <Container>
        <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {p.actLabel}
        </p>
        <h2
          data-carousel-heading
          className="anvl-display mb-8 text-[clamp(1.75rem,3.5vw,2.75rem)]"
        >
          {p.headingLineOne}{' '}
          <span className="text-[var(--color-text-muted)]">{p.headingLineTwo}</span>
        </h2>
      </Container>
      <div className="overflow-x-auto pb-4">
        <div className="flex w-max max-w-none gap-4 px-[max(1rem,calc((100%-min(100%,80rem))/2))] pr-6 md:pl-8 md:pr-12">
          {showcaseProducts.map((product) => (
            <Link
              key={product.id}
              to="/shop/$slug"
              params={{ slug: product.slug }}
              data-carousel-card
              className="w-56 shrink-0 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] p-3 transition-colors hover:border-[var(--color-text-muted)]"
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
              <p className="mt-3 text-sm font-medium">{product.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">${product.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
