import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { memo } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { WarBanner } from '@/shared/components/premium/WarBanner'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { withShopifyImageWidth } from '@/shared/lib/url'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/** Grid cards render at most ~400 CSS px wide; covers retina at that size. */
const CARD_IMAGE_WIDTH = 800

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

/**
 * Catalog card — the landing page's war banner married to the shop card's
 * info plate. The gonfalon carries the product media (tilting toward the
 * pointer, status pinned to the crossbar like a heraldic label); below it a
 * fixed-structure plate (role, name, price, colorways, view affordance) keeps
 * every card in a grid exactly the same size.
 */
export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const chip = statusChip(product)
  const shop = product.shop
  const showCompare =
    typeof shop?.compareAtPrice === 'number' && shop.compareAtPrice > product.price
  const rawMedia = product.images[0]?.src
  const media = rawMedia ? withShopifyImageWidth(rawMedia, CARD_IMAGE_WIDTH) : rawMedia
  const alt = product.images[0]?.alt ?? `${product.name} editorial placeholder`

  return (
    <article className="group relative flex h-full flex-col motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1">
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        className="focus-ring flex h-full flex-col rounded-md no-underline"
        aria-label={`${stripAngleBracketTags(product.name)} — view piece`}
      >
        {/* Headroom for the crossbar; side padding clears the finial overhang. */}
        <div className="px-2 pt-1.5">
          <WarBanner
            media={media}
            alt={alt}
            label={chip ?? undefined}
            aspectClassName="aspect-[3/4]"
            elevated
          />
        </div>

        {/* Info plate — identical structure on every card so the grid lines up. */}
        <div className="mt-4 flex flex-1 flex-col px-2 pb-1">
          <p className="anvl-micro text-[var(--color-highlight-bright)]">
            {stripAngleBracketTags(product.role)}
          </p>
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <h3 className="anvl-heading line-clamp-2 min-h-[2em] min-w-0 break-words text-xl font-normal leading-[1] md:text-2xl">
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

          <div className="mt-auto flex min-h-6 items-end justify-between gap-3 pt-3">
            {product.colorways.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-2" aria-label="Colorways">
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
            ) : (
              <span aria-hidden="true" />
            )}
            <span className="anvl-micro inline-flex shrink-0 items-center gap-1 text-[var(--color-text)] transition-colors duration-300 group-hover:text-[var(--color-highlight-bright)]">
              View piece
              <ArrowUpRight
                size={ICON_SIZE.xs}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
})
