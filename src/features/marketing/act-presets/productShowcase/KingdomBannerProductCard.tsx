import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'
import {
  formatProductPrice,
  productAvailabilityLabel,
  productSaleLabel,
  resolveProductHref,
} from './oathProductUtils'
import { useKingdomBannerTilt } from './useKingdomBannerTilt'

type KingdomBannerProductCardProps = {
  product: Product
  index: number
  className?: string
}

function BannerRod() {
  return (
    <div className="relative flex h-2 w-full shrink-0 items-center justify-center" aria-hidden>
      <div className="absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--anvl-bone)_50%,transparent)] to-transparent" />
      <div className="relative h-1.5 w-[calc(100%-0.25rem)] rounded-full border border-[color-mix(in_srgb,var(--anvl-bone)_30%,transparent)] bg-gradient-to-b from-[#454850] via-[#2e3136] to-[#1c1e22] shadow-[0_1px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="absolute -left-0.5 top-1/2 size-1 -translate-y-1/2 rounded-full border border-[color-mix(in_srgb,var(--anvl-bone)_38%,transparent)] bg-[#62666c]" />
        <div className="absolute -right-0.5 top-1/2 size-1 -translate-y-1/2 rounded-full border border-[color-mix(in_srgb,var(--anvl-bone)_38%,transparent)] bg-[#62666c]" />
      </div>
    </div>
  )
}

export function KingdomBannerProductCard({
  product,
  index,
  className,
}: KingdomBannerProductCardProps) {
  const { mountRef, fabricRef, innerRef } = useKingdomBannerTilt()
  const img = product.images[0]
  const sale = productSaleLabel(product)

  return (
    <article
      ref={mountRef}
      data-act-block
      className={cn(
        'anvl-banner-card group/banner pointer-events-auto relative mx-auto flex flex-col [transform-style:preserve-3d]',
        className,
      )}
    >
      <BannerRod />

      <div className="relative flex shrink-0 flex-col items-center" aria-hidden>
        <div className="h-1 w-px bg-gradient-to-b from-[color-mix(in_srgb,var(--anvl-bone)_45%,transparent)] to-transparent" />
        <div className="size-0.5 rounded-full border border-[color-mix(in_srgb,var(--anvl-bone)_42%,transparent)] bg-[#3d4046]" />
      </div>

      <div
        ref={fabricRef}
        className="relative min-h-0 flex-1 px-[5%] [transform-style:preserve-3d] will-change-transform"
        style={{ transformOrigin: '50% 0%' }}
      >
        <a
          href={resolveProductHref(product)}
          target="_blank"
          rel="noopener noreferrer"
          data-act-micro
          className="relative block h-full focus-ring outline-offset-2"
        >
          <div
            ref={innerRef}
            className={cn(
              'relative flex h-full flex-col overflow-hidden will-change-transform',
              'border border-[color-mix(in_srgb,var(--anvl-bone)_32%,transparent)]',
              'bg-gradient-to-b from-[#282b31] via-[#17191e] to-[#0a0b0e]',
              'shadow-[0_8px_18px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]',
              'transition-[border-color,box-shadow] duration-500',
              'group-hover/banner:border-[color-mix(in_srgb,var(--anvl-bone)_52%,transparent)]',
              'group-hover/banner:shadow-[0_14px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)]',
            )}
            style={{
              clipPath:
                'polygon(8% 0, 92% 0, 100% 4%, 100% calc(100% - 0.65rem), 50% 100%, 0 calc(100% - 0.65rem), 0 4%)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 z-[1] opacity-[0.1]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)',
              }}
              aria-hidden
            />

            <div className="relative z-[3] shrink-0 border-b border-[color-mix(in_srgb,var(--anvl-bone)_16%,transparent)] px-1 py-1 text-center">
              <p data-act-eyebrow>{String(index + 1).padStart(2, '0')}</p>
              <h3 data-act-card-title className="mt-px line-clamp-2">
                {product.name}
              </h3>
            </div>

            <div className="relative z-[3] min-h-0 flex-1 overflow-hidden">
              {img ? (
                <img
                  src={img.src}
                  alt={img.alt}
                  className="size-full object-cover object-top transition-[filter] duration-500 group-hover/banner:brightness-110"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-[var(--color-bg)] text-[var(--color-muted)]">
                  —
                </div>
              )}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0b0e]/90 via-transparent to-transparent"
                aria-hidden
              />
              {sale ? (
                <span
                  data-act-card-meta
                  className="absolute left-1 top-1 rounded border border-[color-mix(in_srgb,var(--anvl-bone)_25%,transparent)] bg-[var(--color-bg)]/85 px-1 py-px font-semibold text-[var(--color-accent)]"
                >
                  {sale}
                </span>
              ) : null}
            </div>

            <div className="relative z-[3] shrink-0 px-1 py-1 pb-1.5">
              <div className="flex items-center justify-between gap-1 border-t border-[color-mix(in_srgb,var(--anvl-bone)_14%,transparent)] pt-1">
                <span
                  data-act-card-title
                  className="font-display tabular-nums normal-case tracking-normal"
                >
                  {formatProductPrice(product)}
                </span>
                <span data-act-card-meta>{productAvailabilityLabel(product)}</span>
              </div>
            </div>
          </div>
        </a>
      </div>
    </article>
  )
}
