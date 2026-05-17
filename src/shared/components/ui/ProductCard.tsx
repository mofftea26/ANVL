import { Link } from '@tanstack/react-router'
import { memo } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Badge } from './Badge'
import { cn } from '@/shared/lib/cn'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'

function statusChip(product: Product): string | null {
  const s = product.shop?.storefrontStatus
  if (!s) return null
  switch (s) {
    case 'comingSoon':
      return 'Coming soon'
    case 'outOfStock':
      return 'Out of stock'
    case 'sale':
      return 'Sale'
    case 'limitedEdition':
      return 'Limited'
    case 'available':
    default:
      return null
  }
}

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const chip = statusChip(product)
  const shop = product.shop
  const showCompare =
    typeof shop?.compareAtPrice === 'number' && shop.compareAtPrice > product.price

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]',
        'md:transition-transform md:hover:scale-[1.01]',
      )}
    >
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        className="focus-ring block rounded-xl no-underline"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b border-[var(--color-line)]">
          <img
            src={product.images[0]?.src ?? '/brand/placeholder-product.svg'}
            alt={product.images[0]?.alt ?? `${product.name} editorial placeholder`}
            className="h-full w-full object-cover md:transition-transform md:duration-300 md:group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <AnvlCompactMark
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-3 h-6 w-auto text-[var(--color-heading)] opacity-30 mix-blend-overlay"
          />
          {chip ? (
            <span className="absolute left-3 top-3 rounded-full border border-[var(--color-line)] bg-[rgba(11,11,12,0.88)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-heading)]">
              {chip}
            </span>
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="anvl-heading text-2xl">
              {stripAngleBracketTags(product.name)}
            </h3>
            <div className="text-right text-sm">
              {showCompare && shop ? (
                <p className="text-[var(--color-text-muted)] line-through">
                  ${shop.compareAtPrice}
                </p>
              ) : null}
              <p className="font-semibold text-[var(--color-text)]">${product.price}</p>
            </div>
          </div>
          <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">
            {stripAngleBracketTags(product.role)}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colorways.map((colorway) => (
              <Badge key={colorway.name}>
                {stripAngleBracketTags(colorway.name)}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
    </article>
  )
})
