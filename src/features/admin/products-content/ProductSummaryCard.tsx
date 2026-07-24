import { Package, RefreshCw } from '@/shared/icons'
import type { Product } from '@/features/products/types/product.types'
import type { PdpProductContent } from '@/features/cms/pdpContent/pdpContent.zod'
import { hasAuthoredPdpContent } from '@/features/cms/pdpContent/pdpContent.zod'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import { ICON_SIZE } from '@/shared/lib/iconSize'

interface ProductSummaryCardProps {
  product: Product | null
  slug: string
  authored: PdpProductContent
  onChangeProduct: () => void
}

/**
 * Compact "currently editing" chip that replaces the picker dropdown: shows the
 * selected product's thumbnail, name, category/fit, and whether it already has
 * authored content, plus a "Change product" button that reopens the modal.
 */
export function ProductSummaryCard({
  product,
  slug,
  authored,
  onChangeProduct,
}: ProductSummaryCardProps) {
  const image = product?.images[0]?.src
  const safeImage = image && isLikelySafeMediaSrc(image) ? image : null
  const isAuthored = hasAuthoredPdpContent(authored)

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]">
        {safeImage ? (
          <img
            src={safeImage}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Package size={22} aria-hidden="true" className="text-[var(--color-text-muted)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Editing product
        </p>
        <p className="truncate text-sm font-medium text-[var(--color-text)]">
          {product?.name ?? slug ?? 'None selected'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {product?.shop?.category ? (
            <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {product.shop.category}
            </span>
          ) : null}
          {product?.shop?.fit ? (
            <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {product.shop.fit}
            </span>
          ) : null}
          <span
            className={
              isAuthored
                ? 'rounded border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-accent)]'
                : 'rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-text-muted)]'
            }
          >
            {isAuthored ? 'Authored' : 'Not authored'}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onChangeProduct}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
      >
        <RefreshCw size={ICON_SIZE.sm} aria-hidden="true" />
        Change product
      </button>
    </div>
  )
}
