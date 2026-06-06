import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { memo } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { AnvlCompactMark } from '@/shared/assets/brand'
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
        'group relative overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]',
        'motion-safe:transition-[border-color,transform] motion-safe:duration-300',
        'hover:border-[color-mix(in_oklab,var(--color-ember)_50%,var(--color-line))] motion-safe:hover:-translate-y-1',
      )}
    >
      {/* Forged top rail — ember filament brightens + travels on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[var(--color-ember)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-90"
      />
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        className="focus-ring block rounded-md no-underline"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b border-[var(--color-line)]">
          <img
            src={product.images[0]?.src ?? '/brand/placeholder-product.svg'}
            alt={product.images[0]?.alt ?? `${product.name} editorial placeholder`}
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 md:group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 90% 70% at 50% 30%, transparent 45%, rgba(0,0,0,0.4) 100%)',
            }}
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
          <span className="anvl-micro absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[rgba(11,11,12,0.7)] px-2.5 py-1 text-[var(--color-text)] opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            View piece <ArrowUpRight size={12} aria-hidden="true" />
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="anvl-heading min-w-0 break-words text-xl font-normal md:text-2xl">
              {stripAngleBracketTags(product.name)}
            </h3>
            <div className="shrink-0 text-right text-sm">
              {showCompare && shop ? (
                <p className="text-[var(--color-text-muted)] line-through">
                  ${shop.compareAtPrice}
                </p>
              ) : null}
              <p className="anvl-display text-[var(--color-text)]">${product.price}</p>
            </div>
          </div>
          <p className="anvl-micro text-[var(--color-ember-bright)]">
            {stripAngleBracketTags(product.role)}
          </p>
          {product.colorways.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-2 pt-1" aria-label="Colorways">
              {product.colorways.map((colorway) => (
                <li
                  key={colorway.name}
                  title={stripAngleBracketTags(colorway.name)}
                  className="h-4 w-4 rounded-full ring-1 ring-[var(--color-line)]"
                  style={{
                    backgroundColor: colorway.base,
                    boxShadow: `inset 0 0 0 2px ${colorway.accent}33`,
                  }}
                >
                  <span className="sr-only">{stripAngleBracketTags(colorway.name)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
    </article>
  )
})
