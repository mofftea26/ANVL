import type { Product } from '@/features/products/types/product.types'
import {
  formatProductPrice,
  productAvailabilityLabel,
  resolveProductHref,
} from '@/features/marketing/act-presets/productShowcase/oathProductUtils'
import { cn } from '@/shared/lib/cn'
import { useProductCardParallaxTilt } from './useProductCardParallaxTilt'

export type ParallaxProductCardProps = {
  product: Product
  index: number
  /** Smaller card for pinned products beat — no internal scroll. */
  compact?: boolean
}

/**
 * Featured product card with subtle 3D mouse tilt — all cards stay in viewport grid.
 * Compact mode is deprecated here; pinned beat uses {@link ProductShowcaseCard}.
 */
export function ParallaxProductCard({ product, index, compact = false }: ParallaxProductCardProps) {
  const { cardRef, imgRef } = useProductCardParallaxTilt()
  const img = product.images[0]
  const href = resolveProductHref(product)

  return (
    <article
      ref={cardRef}
      data-brand-product
      className={cn(
        'group pointer-events-auto relative min-h-0 [transform-style:preserve-3d] will-change-[transform,opacity,filter]',
        compact && 'flex h-full max-h-full flex-col',
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex min-h-0 flex-col overflow-hidden border border-[var(--color-line)]/70 bg-[var(--color-surface)]/30 backdrop-blur-[2px] transition-[border-color,background-color] duration-300 hover:border-[var(--color-line)] hover:bg-[var(--color-surface)]/45',
          compact ? 'h-full' : 'h-auto',
        )}
      >
        <div
          ref={imgRef}
          data-brand-product-img
          className={cn(
            'relative min-h-0 overflow-hidden bg-[var(--color-bg)] will-change-transform',
            compact ? 'w-full flex-1' : 'aspect-[4/5]',
          )}
        >
          {img ? (
            <img
              src={img.src}
              alt={img.alt}
              className="size-full object-cover transition-[filter,transform] duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-bg)] text-[var(--color-muted)]">
              <span className="font-display text-2xl uppercase tracking-[0.2em] opacity-40">
                {product.name.slice(0, 1)}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex shrink-0 flex-col items-center justify-center text-center',
            compact
              ? 'px-1.5 py-1.5 sm:px-2 sm:py-2 md:px-2.5 md:py-2.5'
              : 'flex-1 px-3 py-3 md:px-3.5 md:py-3.5',
          )}
        >
          <p
            className={cn(
              'uppercase tracking-[0.24em] text-[var(--color-muted)]',
              compact
                ? 'text-[0.6rem] leading-tight tracking-[0.14em] sm:text-[length:var(--act-eyebrow-size,0.64rem)]'
                : 'text-[length:var(--act-eyebrow-size,0.68rem)]',
            )}
          >
            {String(index + 1).padStart(2, '0')} — {product.dropName}
          </p>
          <h3
            className={cn(
              'font-display uppercase leading-[0.92] text-balance',
              compact
                ? 'mt-0.5 text-[clamp(0.68rem,min(2.6vw,2.8cqi),1rem)]'
                : 'mt-1.5 text-[clamp(0.95rem,min(2.4vw,2.8cqi),1.35rem)]',
            )}
          >
            {product.name}
          </h3>
          <div
            className={cn(
              'flex flex-wrap items-baseline justify-center gap-x-1',
              compact ? 'mt-1 gap-y-0.5' : 'mt-2 gap-2',
            )}
          >
            <span
              className={cn(
                'font-display tabular-nums text-[var(--color-fg)]',
                compact ? 'text-[0.7rem] sm:text-xs' : 'text-sm md:text-base',
              )}
            >
              {formatProductPrice(product)}
            </span>
            <span
              className={cn(
                'uppercase tracking-[0.18em] text-[var(--color-muted)]',
                compact ? 'text-[0.58rem] tracking-[0.1em] sm:text-[0.6rem]' : 'text-[10px]',
              )}
            >
              {productAvailabilityLabel(product)}
            </span>
          </div>
        </div>
      </a>
    </article>
  )
}
