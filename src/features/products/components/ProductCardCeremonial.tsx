import { Link } from '@tanstack/react-router'
import { memo, useRef } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import {
  PRODUCT_CARD_VARIANTS,
  type ProductCardVariant,
} from './productCardVariants'
import { useProductCardTilt } from './useProductCardTilt'
import { ProductCardQuickAdd } from './ProductCardQuickAdd'

function statusChip(product: Product): string | null {
  switch (product.shop?.storefrontStatus) {
    case 'comingSoon':
      return 'Soon'
    case 'outOfStock':
      return 'Sold out'
    case 'sale':
      return 'Sale'
    case 'limitedEdition':
      return 'Limited'
    default:
      return null
  }
}

/**
 * The Oath Modern product card — a forged specimen tile used app-wide under the
 * experience (shop, PDP related, landing Armory). A sculptural media frame
 * (oxidized hairline, depth shadow, wax-metal edge illumination on hover) over a
 * tight metadata row, the wax-metal vow accent reserved for emphasis + price.
 * Missing media falls back to an INTENTIONAL forged plate (carved name + role),
 * never a broken box. Restrained pointer tilt; quick-add "+" popover is a sibling
 * of the navigation `<Link>` (no nested interactives). Presentation comes from the
 * `variant` config; commerce truth (price/availability) from the catalog.
 *
 * NOTE the theme mapping: `--color-accent` is the wax-metal vow accent
 * (`--color-highlight` is oxidized iron under this theme), so all emphasis/hover
 * highlights use `--color-accent` to stay visible.
 */
export const ProductCardCeremonial = memo(function ProductCardCeremonial({
  product,
  variant = 'default',
  tagline,
  index,
}: {
  product: Product
  variant?: ProductCardVariant
  /** Optional ceremonial line (featured / Armory); omitted elsewhere. */
  tagline?: string
  /** Optional 1-based catalog index rendered as `01`, `02`, … */
  index?: number
}) {
  const cfg = PRODUCT_CARD_VARIANTS[variant]
  const chip = statusChip(product)
  const shop = product.shop
  const showCompare =
    typeof shop?.compareAtPrice === 'number' && shop.compareAtPrice > product.price
  const media = product.images[0]?.src
  const alt = product.images[0]?.alt ?? `${product.name}`
  const name = stripAngleBracketTags(product.name)

  const tiltRef = useRef<HTMLDivElement | null>(null)
  useProductCardTilt(tiltRef, cfg.enableTilt)

  return (
    <article className="group relative h-full">
      <div
        ref={tiltRef}
        className="relative h-full transition-transform duration-300 ease-out [transform-style:preserve-3d] will-change-transform"
      >
        <Link
          to="/shop/$slug"
          params={{ slug: product.slug }}
          aria-label={`${name} — view piece`}
          className="focus-ring block"
        >
          {/* Sculptural media stage. */}
          <div
            className={cn(
              'relative overflow-hidden rounded-sm border bg-[var(--color-surface-elevated)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] transition-[border-color,box-shadow] duration-500',
              cfg.frame,
              cfg.emphasis
                ? 'border-[color-mix(in_srgb,var(--color-accent)_55%,var(--color-line))] group-hover:border-[var(--color-accent)] group-hover:shadow-[0_24px_55px_-22px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]'
                : 'border-[var(--color-line)] group-hover:border-[var(--color-accent)]',
            )}
          >
            {media ? (
              <img
                src={media}
                alt={alt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.05]"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 380px"
              />
            ) : (
              // Intentional forged fallback — carved name on a forged plate.
              <div
                className="absolute inset-0 grid place-items-center p-4 text-center"
                style={{
                  backgroundImage:
                    'radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--color-surface-elevated) 80%, transparent), var(--color-bg))',
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg, var(--color-text) 0 1px, transparent 1px 7px)',
                  }}
                />
                <span className="relative">
                  <span className="anvl-heading block text-base uppercase leading-tight text-[color:var(--color-heading)]">
                    {name}
                  </span>
                  <span className="anvl-micro mt-1 block text-[0.55rem] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                    {stripAngleBracketTags(product.role)}
                  </span>
                </span>
              </div>
            )}

            {typeof index === 'number' ? (
              <span className="anvl-micro absolute left-2 top-2 text-[0.6rem] tracking-[0.2em] text-[color:var(--color-accent)]">
                {String(index).padStart(2, '0')}
              </span>
            ) : null}

            {chip ? (
              <span className="anvl-micro absolute left-2 bottom-2 rounded-sm border border-[var(--border-strong)] bg-[var(--color-overlay)] px-1.5 py-0.5 text-[0.5rem] uppercase tracking-[0.16em] text-[color:var(--color-text)] backdrop-blur-sm">
                {chip}
              </span>
            ) : null}

            {/* Wax-metal hairline sweeping the base of the frame on hover. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 block h-px w-0 bg-[var(--color-accent)] transition-all duration-500 ease-out group-hover:w-full"
            />
          </div>

          {/* Compact metadata BELOW the media. */}
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3
                className={cn(
                  'anvl-heading min-w-0 truncate font-normal uppercase leading-tight tracking-[0.01em]',
                  cfg.heading,
                )}
              >
                {name}
              </h3>
              <p className="anvl-display shrink-0 text-sm text-[color:var(--color-text)]">
                {showCompare && shop ? (
                  <span className="mr-1.5 text-xs text-[color:var(--color-text-muted)] line-through">
                    ${shop.compareAtPrice}
                  </span>
                ) : null}
                ${product.price}
              </p>
            </div>

            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="anvl-micro truncate text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                {stripAngleBracketTags(product.role)}
              </span>
              {product.colorways.length > 0 ? (
                <ul className="flex shrink-0 items-center gap-1" aria-label="Colorways">
                  {product.colorways.map((colorway) => (
                    <li
                      key={colorway.name}
                      title={stripAngleBracketTags(colorway.name)}
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-[var(--border-strong)]"
                      style={{ backgroundColor: colorway.base }}
                    >
                      <span className="sr-only">{stripAngleBracketTags(colorway.name)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {cfg.showTagline && tagline ? (
              <p className="mt-1.5 line-clamp-1 text-xs text-[color:var(--color-text-muted)]">
                {tagline}
              </p>
            ) : null}
          </div>
        </Link>

        {cfg.enableQuickAdd ? <ProductCardQuickAdd product={product} /> : null}
      </div>
    </article>
  )
})
