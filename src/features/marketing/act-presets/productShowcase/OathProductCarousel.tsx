import { useRef, useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import { ProductShowcaseHeader } from './ProductShowcaseHeader'
import {
  formatProductPrice,
  productAvailabilityLabel,
  resolveProductHref,
} from './oathProductUtils'
import { resolveProductShowcaseProducts } from '../resolveProductShowcaseProducts'
import { cn } from '@/shared/lib/cn'

export function OathProductCarouselPreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const p = previewPiecesFields(landing.pieces, row)
  const items = resolveProductShowcaseProducts(products, row?.productIds)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useActPresetMotion(rootRef, row, { staggerSelector: '[data-carousel-card]' })

  const updateScrollState = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const { scrollLeft, scrollWidth, clientWidth } = track
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const track = trackRef.current
    if (!track) return
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(track)
    return () => ro.disconnect()
  }, [items.length, updateScrollState])

  const scrollBy = (dir: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.72, behavior: 'smooth' })
  }

  return (
    <ActPresetShell
      rootRef={rootRef}
      row={row}
      sectionSize="showcase"
      ariaLabel="Product carousel"
      contentClassName="overflow-x-clip"
    >
      <ProductShowcaseHeader
        actLabel={p.actLabel}
        headingLineOne={p.headingLineOne}
        headingLineTwo={p.headingLineTwo}
        viewAllHref={p.viewAllHref}
        viewAllLabel={p.viewAllLabel}
      />

      <div className="relative min-h-0 flex-1">
        {canScrollLeft ? (
          <button
            type="button"
            aria-label="Scroll products left"
            onClick={() => scrollBy(-1)}
            className="focus-ring absolute left-0 top-1/2 z-20 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/90 text-[var(--color-fg)] backdrop-blur-sm md:flex"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
        ) : null}
        {canScrollRight ? (
          <button
            type="button"
            aria-label="Scroll products right"
            onClick={() => scrollBy(1)}
            className="focus-ring absolute right-0 top-1/2 z-20 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/90 text-[var(--color-fg)] backdrop-blur-sm md:flex"
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        ) : null}

        <div
          ref={trackRef}
          onScroll={updateScrollState}
          className="anvl-act-showcase-track min-h-0 snap-x snap-mandatory"
        >
          {items.map((product, index) => {
            const img = product.images[0]
            return (
              <a
                key={product.id}
                href={resolveProductHref(product)}
                target="_blank"
                rel="noopener noreferrer"
                data-carousel-card
                data-act-block
                data-act-micro
                className={cn(
                  'anvl-act-showcase-card group/card flex snap-start flex-col overflow-hidden',
                  'rounded-[var(--act-card-radius)] border border-[var(--color-line)] bg-[var(--color-surface)]/35',
                  'transition-[border-color,transform,box-shadow] duration-300',
                  'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--anvl-bone)_28%,transparent)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.32)]',
                )}
              >
                <div className="relative aspect-[4/5] max-h-[62%] overflow-hidden bg-[var(--color-bg)]">
                  {img ? (
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : null}
                  <span
                    data-act-card-meta
                    className="absolute left-1.5 top-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/75 px-1.5 py-px backdrop-blur-sm"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 p-1.5">
                  <h3 data-act-card-title className="line-clamp-2">
                    {product.name}
                  </h3>
                  <p data-act-card-body className="line-clamp-1">
                    {product.fabric}
                  </p>
                  <div className="mt-auto flex items-baseline justify-between pt-1">
                    <span data-act-card-title className="font-medium normal-case tracking-normal">
                      {formatProductPrice(product)}
                    </span>
                    <span data-act-card-meta>{productAvailabilityLabel(product)}</span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </ActPresetShell>
  )
}
