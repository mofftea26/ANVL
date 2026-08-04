import { Link } from '@tanstack/react-router'
import { memo } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { effectivePrice } from '@/features/products/catalog/storefrontCatalog'
import { DEFAULT_EMBLEM_SRC, isBundledPlaceholderImage } from '@/shared/constants/brandAssets'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { withShopifyImageWidth } from '@/shared/lib/url'
import { formatMoney } from '@/shared/lib/money'

/** Related-card image renders small in a tight "complete the kit" strip. */
const RELATED_IMAGE_WIDTH = 400

/**
 * Compact related-product card — small image + name/price on one line and a
 * one-line description. Lighter than the shop grid card (navigation only), tuned
 * to sit in a tight 4-up "complete the kit" strip. Theme-aware via `--shop-*`.
 */
export const PdpRelatedCard = memo(function PdpRelatedCard({ product }: { product: Product }) {
  const primary = product.images[0]
  const hasImage = Boolean(primary?.src) && !isBundledPlaceholderImage(primary?.src)
  const blurb = product.role || product.storytelling || ''

  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className="group/rel focus-ring flex flex-col gap-2.5 rounded-lg no-underline"
      aria-label={`${stripAngleBracketTags(product.name)} — view piece`}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-image-bg)] transition-colors group-hover/rel:border-[var(--shop-accent)]">
        {hasImage ? (
          <img
            src={withShopifyImageWidth(primary!.src, RELATED_IMAGE_WIDTH)}
            alt={primary!.alt || product.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover/rel:scale-[1.05]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-5">
            <img src={DEFAULT_EMBLEM_SRC} alt="" aria-hidden="true" className="max-h-[55%] w-auto opacity-60" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="anvl-heading truncate text-sm font-normal leading-tight text-[var(--shop-text)] transition-colors group-hover/rel:text-[var(--shop-accent)]">
            {stripAngleBracketTags(product.name)}
          </h3>
          <p className="anvl-display shrink-0 text-xs text-[var(--shop-text-muted)]">{formatMoney(effectivePrice(product), product.shop?.currency)}</p>
        </div>
        {blurb ? (
          <p className="mt-1 line-clamp-1 text-[0.7rem] leading-relaxed text-[var(--shop-text-muted)]">
            {stripAngleBracketTags(blurb)}
          </p>
        ) : null}
      </div>
    </Link>
  )
})
