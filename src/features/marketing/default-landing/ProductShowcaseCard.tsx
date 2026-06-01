import type { Ref } from 'react'
import type { Product } from '@/features/products/types/product.types'
import {
  formatProductPrice,
  productAvailabilityLabel,
  resolveProductHref,
} from '@/features/marketing/act-presets/productShowcase/oathProductUtils'
import { cn } from '@/shared/lib/cn'
import { useProductCardParallaxTilt } from './useProductCardParallaxTilt'

export type ProductShowcaseCardProps = {
  product: Product
  index: number
}

/**
 * Cinematic product banner for the pinned brand showcase beat —
 * full-bleed poster imagery, editorial overlay type, desktop mouse tilt.
 */
export function ProductShowcaseCard({ product, index }: ProductShowcaseCardProps) {
  const { cardRef, imgRef } = useProductCardParallaxTilt()
  const img = product.images[0]
  const href = resolveProductHref(product)
  const indexLabel = String(index + 1).padStart(2, '0')
  const isAvailable = product.shop?.storefrontStatus !== 'outOfStock'

  return (
    <article
      data-brand-product
      className="group pointer-events-auto relative h-full min-h-0 w-full will-change-[transform,opacity,filter]"
    >
      <div className="brand-product-banner__scale h-full min-h-0 w-full">
        <div
          ref={cardRef as Ref<HTMLDivElement>}
          className="relative h-full min-h-0 w-full [transform-style:preserve-3d]"
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'brand-product-banner relative flex h-full min-h-0 w-full overflow-hidden rounded-[1px]',
              'transition-[box-shadow] duration-500 ease-out',
              'hover:shadow-[0_0_56px_-14px_color-mix(in_srgb,var(--color-accent)_42%,transparent),0_18px_40px_-28px_rgba(0,0,0,0.85)]',
            )}
          >
            <div
              ref={imgRef}
              data-brand-product-img
              className="absolute inset-[-6%] will-change-transform"
              aria-hidden
            >
              {img ? (
                <img
                  src={img.src}
                  alt=""
                  className="size-full object-cover transition-[filter] duration-500 ease-out group-hover:brightness-[1.08]"
                  loading="lazy"
                />
              ) : (
                <div className="relative size-full bg-gradient-to-br from-[var(--color-surface-elevated)] via-[var(--color-bg)] to-black">
                  <div className="absolute inset-0 opacity-50 bg-[radial-gradient(ellipse_90%_70%_at_24%_18%,color-mix(in_srgb,var(--color-accent)_24%,transparent),transparent_58%)]" />
                  <div className="absolute inset-0 flex items-end justify-start p-3 sm:p-4">
                    <span className="font-display text-[clamp(2rem,8cqi,3.5rem)] uppercase leading-none tracking-[0.06em] text-[color-mix(in_srgb,var(--color-accent)_32%,var(--color-muted))]">
                      {product.name.slice(0, 1)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/18 to-black/82"
              aria-hidden
            />
            <div
              className="brand-product-banner__accent pointer-events-none absolute inset-0"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-black/45 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/78 via-black/42 to-transparent"
              aria-hidden
            />

            <div className="brand-product-banner__frame pointer-events-none absolute inset-0" aria-hidden />

            <div className="relative z-10 flex h-full min-h-0 w-full flex-col justify-between p-2 sm:p-2.5 md:p-2.5">
              <div className="flex items-start justify-between gap-1.5">
                <span className="font-display text-[clamp(0.62rem,2.2cqi,0.9rem)] tabular-nums leading-none tracking-[0.28em] text-[var(--color-accent)]">
                  {indexLabel}
                </span>
                <span className="max-w-[46%] truncate text-right text-[0.46rem] uppercase leading-tight tracking-[0.2em] text-[color-mix(in_srgb,var(--color-fg)_72%,transparent)] sm:text-[0.5rem]">
                  {product.dropName}
                </span>
              </div>

              <div className="mt-auto space-y-1 sm:space-y-1.5">
                <h3 className="font-display text-left text-[clamp(0.72rem,min(3vw,3.6cqi),1.12rem)] uppercase leading-[0.88] tracking-[0.02em] text-balance text-[var(--color-fg)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                  {product.name}
                </h3>

                <div className="flex items-end justify-between gap-1.5">
                  <span className="font-display text-[clamp(0.62rem,2.2cqi,0.82rem)] tabular-nums leading-none text-[var(--color-fg)] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                    {formatProductPrice(product)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 border px-1 py-px text-[0.42rem] uppercase leading-none tracking-[0.16em] backdrop-blur-[2px] sm:text-[0.46rem]',
                      isAvailable
                        ? 'border-[color-mix(in_srgb,var(--color-accent)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--color-accent)_88%,var(--color-fg))]'
                        : 'border-[color-mix(in_srgb,var(--color-line)_55%,transparent)] bg-black/25 text-[var(--color-muted)]',
                    )}
                  >
                    {productAvailabilityLabel(product)}
                  </span>
                </div>
              </div>
            </div>

            {img ? (
              <span className="sr-only">
                {product.name} — {formatProductPrice(product)}
              </span>
            ) : null}
          </a>
        </div>
      </div>
    </article>
  )
}
