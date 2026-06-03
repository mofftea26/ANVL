import { useRef } from 'react'
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

/** Spotlight row — image-forward cards with bottom metadata. */
export function OathSpotlightRowPreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const p = previewPiecesFields(landing.pieces, row)
  const items = resolveProductShowcaseProducts(products, row?.productIds)

  useActPresetMotion(rootRef, row, { staggerSelector: '[data-spotlight-card]' })

  return (
    <ActPresetShell
      rootRef={rootRef}
      row={row}
      sectionSize="showcase"
      ariaLabel="Product spotlight"
      contentClassName="overflow-x-clip"
    >
      <ProductShowcaseHeader
        actLabel={p.actLabel}
        headingLineOne={p.headingLineOne}
        headingLineTwo={p.headingLineTwo}
        viewAllHref={p.viewAllHref}
        viewAllLabel={p.viewAllLabel}
      />

      <div className="anvl-act-showcase-track anvl-act-showcase-track--grid min-h-0 flex-1">
        {items.slice(0, 3).map((product, index) => {
          const img = product.images[0]
          return (
            <a
              key={product.id}
              href={resolveProductHref(product)}
              target="_blank"
              rel="noopener noreferrer"
              data-spotlight-card
              data-act-block
              data-act-micro
              className={cn(
                'anvl-act-showcase-card group/spot relative flex h-[min(28cqi,11rem)] snap-center flex-col overflow-hidden',
                'rounded-[var(--act-card-radius)] border border-[var(--color-line)] bg-[var(--color-bg)]',
                'transition-[border-color,box-shadow] duration-300',
                'hover:border-[color-mix(in_srgb,var(--anvl-bone)_26%,transparent)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]',
                'md:snap-align-none',
              )}
            >
              {img ? (
                <img
                  src={img.src}
                  alt={img.alt}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover/spot:scale-[1.04]"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--color-surface)]" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/35 to-transparent"
                aria-hidden
              />
              <div className="relative mt-auto p-2">
                <p data-act-eyebrow>{String(index + 1).padStart(2, '0')}</p>
                <h3 data-act-card-title className="mt-0.5 line-clamp-2">
                  {product.name}
                </h3>
                <div className="mt-1 flex items-baseline justify-between gap-2">
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
    </ActPresetShell>
  )
}
