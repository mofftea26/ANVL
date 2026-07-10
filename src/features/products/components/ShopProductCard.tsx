import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Eye, Share2 } from 'lucide-react'
import { memo } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import { effectivePrice } from '@/features/products/catalog/storefrontCatalog'
import { DEFAULT_EMBLEM_SRC, isBundledPlaceholderImage } from '@/shared/constants/brandAssets'
import { ProductCardQuickAdd } from '@/features/products/components/ProductCardQuickAdd'
import { ProductCardBadge } from '@/features/products/components/ProductCardBadge'
import { shareProduct } from '@/features/products/lib/shareProduct'
import { IconButton } from '@/shared/components/ui/IconButton'
import { ShopSurfaceScope } from '@/shared/components/layout/ShopSurfaceScope'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { withShopifyImageWidth } from '@/shared/lib/url'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/** Grid cards render at most ~400 CSS px wide; covers retina at that size. */
const CARD_IMAGE_WIDTH = 800

const ASPECT_CLASS: Record<ShopConfig['cardAspectRatio'], string> = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  tall: 'aspect-[4/5]',
}

/**
 * Product card (v2). A bordered "showroom plate": the CMS material texture is the
 * visible stage, the product floats on it, and a clearly divided info panel sits
 * under the same border so it's always obvious which info belongs to which card.
 * Hover is a clean CSS lift + image zoom (no pointer-tilt). Overlay controls
 * (quick view, share, quick add) are siblings of the navigation Link so they
 * never nest interactive elements. Theme-aware via `--shop-*`.
 */
export const ShopProductCard = memo(function ShopProductCard({
  product,
  config,
  cardTexture,
  cardEmptyImage,
  onQuickView,
}: {
  product: Product
  config: ShopConfig
  cardTexture?: string
  cardEmptyImage?: string
  onQuickView?: (product: Product) => void
}) {
  const shop = product.shop
  const status = shop?.storefrontStatus ?? 'available'
  const soldOut = status === 'outOfStock' || status === 'comingSoon'
  const price = effectivePrice(product)
  const showCompare =
    config.showComparePrices &&
    typeof shop?.compareAtPrice === 'number' &&
    shop.compareAtPrice > price

  const primary = product.images[0]
  // A bundled placeholder (seed/mock art) is treated as "no image" so the card
  // falls through to the CMS card-empty image, then the emblem — instead of
  // showing the bundled Drop 01 / Oath plate as if it were a real product photo.
  const hasImage = Boolean(primary?.src) && !isBundledPlaceholderImage(primary?.src)
  const alt = primary?.alt ?? `${stripAngleBracketTags(product.name)}`
  const cover = config.imageFit === 'cover'
  const quickViewEnabled = config.quickViewEnabled && Boolean(onQuickView) && !soldOut

  return (
    <article
      data-flip-id={product.id}
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--shop-card-radius,14px)] border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-[var(--shop-accent)] hover:shadow-[0_24px_60px_-28px_var(--shop-card-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Overlay controls — siblings of the Link. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-2.5">
        <ShopSurfaceScope className="contents">
          <div className="flex gap-1.5">
            {quickViewEnabled ? (
              <button
                type="button"
                onClick={() => onQuickView?.(product)}
                aria-label={`Quick view ${stripAngleBracketTags(product.name)}`}
                className="focus-ring pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--shop-card-border)] bg-[var(--shop-overlay)] px-3 text-xs text-[var(--shop-text)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--shop-accent)] hover:text-[var(--shop-accent)] lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
              >
                <Eye size={ICON_SIZE.sm} aria-hidden="true" />
                <span className="hidden sm:inline">Quick view</span>
              </button>
            ) : null}
            <IconButton
              variant="overlay"
              size="sm"
              onClick={() => void shareProduct(product)}
              aria-label={`Share ${stripAngleBracketTags(product.name)}`}
              className="pointer-events-auto lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
            >
              <Share2 size={15} aria-hidden="true" />
            </IconButton>
          </div>
        </ShopSurfaceScope>
      </div>

      {config.quickAddEnabled ? <ProductCardQuickAdd product={product} /> : null}

      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        className="focus-ring flex h-full flex-col no-underline"
        aria-label={`${stripAngleBracketTags(product.name)} — view piece`}
      >
        {/* Material stage. */}
        <div
          className={cn('relative overflow-hidden', ASPECT_CLASS[config.cardAspectRatio])}
          style={
            cardTexture
              ? { backgroundImage: `url('${cardTexture}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(150deg, var(--shop-card-bg) 0%, var(--shop-image-bg) 60%, var(--shop-card-bg-2) 100%)' }
          }
        >
          {/* Readability vignette over the texture. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 30%, transparent 40%, color-mix(in srgb, var(--shop-bg) 55%, transparent) 100%)',
            }}
          />

          {hasImage ? (
            <img
              src={withShopifyImageWidth(primary!.src, CARD_IMAGE_WIDTH)}
              alt={alt}
              loading="lazy"
              decoding="async"
              className={cn(
                'absolute inset-0 h-full w-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]',
                cover ? 'object-cover' : 'object-contain p-2.5',
              )}
            />
          ) : (
            // Per-card empty state — product has no real photo. Prefer the CMS
            // card-empty image; only fall back to the bundled emblem when no
            // card-empty image is assigned.
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <img
                src={cardEmptyImage || DEFAULT_EMBLEM_SRC}
                alt=""
                aria-hidden="true"
                className="max-h-[62%] w-auto opacity-70"
                style={cardEmptyImage ? undefined : { filter: 'drop-shadow(0 0 22px var(--shop-card-glow))' }}
              />
            </div>
          )}

          {config.showBadges ? (
            <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-10">
              <ProductCardBadge product={product} showInventoryUrgency={config.showInventoryUrgency} />
            </div>
          ) : null}
        </div>

        {/* Info panel — fixed structure (reserved line heights) so every card in
            the grid is exactly the same size regardless of content. */}
        <div className="flex flex-1 flex-col border-t border-[var(--shop-card-border)] p-4">
          <p className="anvl-micro line-clamp-1 min-h-[1.15em] text-[var(--shop-accent)]">
            {product.role ? stripAngleBracketTags(product.role) : ' '}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h3 className="anvl-heading line-clamp-2 min-h-[2.5em] min-w-0 break-words text-lg font-normal leading-[1.05] text-[var(--shop-text)] md:text-xl">
              {stripAngleBracketTags(product.name)}
            </h3>
            {config.showPrices ? (
              <div className="shrink-0 text-right text-sm">
                {showCompare && shop ? (
                  <p className="text-[var(--shop-text-muted)] line-through">${shop.compareAtPrice}</p>
                ) : null}
                <p className="anvl-display text-[var(--shop-text)]">${price}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex min-h-[2.25rem] items-end justify-between gap-3 pt-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              {config.showSwatches && product.colorways.length > 0 ? (
                <ul className="flex flex-wrap items-center gap-1.5" aria-label="Colorways">
                  {product.colorways.slice(0, 5).map((c) => (
                    <li
                      key={c.name}
                      title={stripAngleBracketTags(c.name)}
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-[var(--shop-card-border)]"
                      style={{ backgroundColor: c.base, boxShadow: `inset 0 0 0 2px ${c.accent}33` }}
                    >
                      <span className="sr-only">{stripAngleBracketTags(c.name)}</span>
                    </li>
                  ))}
                  {product.colorways.length > 5 ? (
                    <li className="anvl-micro text-[var(--shop-text-muted)]">
                      +{product.colorways.length - 5}
                    </li>
                  ) : null}
                </ul>
              ) : null}
              {config.showSizes && product.sizes.length > 0 ? (
                <p className="anvl-micro truncate text-[0.6rem] text-[var(--shop-text-muted)]">
                  {product.sizes.join(' · ')}
                </p>
              ) : null}
            </div>
            <span className="anvl-micro inline-flex shrink-0 items-center gap-1 text-[var(--shop-text)] transition-colors duration-300 group-hover:text-[var(--shop-accent)]">
              View
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
