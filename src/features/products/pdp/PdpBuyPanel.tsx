import { Link } from '@tanstack/react-router'
import { Check, Loader2, Share2 } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import type { PdpVariant } from '@/features/products/pdp/hooks/usePdpVariant'
import { colorHasNoStock } from '@/features/products/pdp/hooks/usePdpVariant'
import { shareProduct } from '@/features/products/lib/shareProduct'
import {
  Button,
  ColorSwatch,
  QuantityStepper,
  SizeSelector,
} from '@/shared/components/ui'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { PdpSizeSuggestion } from '@/features/products/pdp/PdpSizeSuggestion'

function MetaChip({ label }: { label: string }) {
  return (
    <span className="anvl-micro rounded-full border border-[var(--shop-card-border)] bg-[var(--shop-surface)] px-2.5 py-1 text-[0.6rem] text-[var(--shop-text-muted)]">
      {label}
    </span>
  )
}

/**
 * PDP purchase panel — the product H1 + everything needed to buy: price/sale,
 * colorway + size selection (per-color availability), quantity, add-to-cart with
 * success state, share, material/fit/care/shipping/returns accordions. All state
 * comes from the shared `usePdpVariant` so the gallery, colorways section, and
 * mobile bar stay in sync. Reads `--shop-*` tokens.
 */
export function PdpBuyPanel({
  product,
  variant,
  showShare,
}: {
  product: Product
  variant: PdpVariant
  showShare: boolean
}) {
  const {
    colorway,
    colorwayIndex,
    setColorwayIndex,
    size,
    setSize,
    quantity,
    setQuantity,
    disabledSizes,
    displayPrice,
    compareAt,
    saleActive,
    status,
    canPurchase,
    addState,
    announce,
    add,
  } = variant

  const statusNote =
    status === 'comingSoon'
      ? 'Coming soon — not available for purchase yet.'
      : status === 'outOfStock'
        ? 'Currently out of stock online.'
        : null

  const metaChips = [product.fit, product.gsm, product.fabric].filter(Boolean)

  return (
    <div className="flex flex-col gap-5">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div>
        <p className="anvl-display inline-flex items-center gap-2 text-[10px] tracking-[0.26em] text-[var(--shop-accent)] before:h-px before:w-5 before:bg-[var(--shop-accent)] before:content-['']">
          {product.dropName}
        </p>
        <h1 className="anvl-heading mt-2.5 text-2xl font-normal leading-[1] text-[var(--shop-text)] sm:text-3xl">
          {product.name}
        </h1>
        {product.role ? (
          <p className="anvl-micro mt-2 text-[var(--shop-text-muted)]">{product.role}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        {saleActive ? (
          <>
            <p className="anvl-heading text-2xl font-normal text-[var(--shop-accent)]">${displayPrice}</p>
            <p className="text-base text-[var(--shop-text-muted)] line-through">${compareAt}</p>
            {product.shop?.saleLabel ? <MetaChip label={product.shop.saleLabel} /> : null}
          </>
        ) : (
          <p className="anvl-heading text-2xl font-normal text-[var(--shop-text)]">${displayPrice}</p>
        )}
      </div>

      {statusNote ? <p className="text-sm text-[var(--shop-text-muted)]">{statusNote}</p> : null}

      {metaChips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {metaChips.map((m) => (
            <MetaChip key={m} label={m} />
          ))}
        </div>
      ) : null}

      {/* Colorway. */}
      {product.colorways.length > 0 ? (
        <div>
          <p className="anvl-micro mb-2 text-[var(--shop-text-muted)]">
            Colorway — {colorway?.name}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {product.colorways.map((c, i) => (
              <ColorSwatch
                key={c.name}
                color={c.base}
                active={i === colorwayIndex}
                label={c.name}
                unavailable={colorHasNoStock(product, c.name)}
                onClick={() => setColorwayIndex(i)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Size. */}
      {product.sizes.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="anvl-micro text-[var(--shop-text-muted)]">Size</p>
            <Link to="/size-guide" className="anvl-micro focus-ring text-[var(--shop-text-muted)] underline-offset-4 hover:text-[var(--shop-accent)] hover:underline">
              Size guide
            </Link>
          </div>
          <SizeSelector sizes={product.sizes} value={size} disabledSizes={disabledSizes} onChange={setSize} />
          <p className="mt-2 text-xs text-[var(--shop-text-muted)]">
            {canPurchase ? 'In stock for this combination.' : 'Not available in this size.'}
          </p>
          <PdpSizeSuggestion sizes={product.sizes} currentSize={size} onSelect={setSize} />
        </div>
      ) : null}

      {/* Quantity + actions. */}
      <div>
        <p className="anvl-micro mb-2 text-[var(--shop-text-muted)]">Quantity</p>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!canPurchase || addState !== 'idle'}
          onClick={add}
        >
          {addState === 'added' ? (
            <>
              <Check size={ICON_SIZE.md} aria-hidden="true" className="mr-2" /> Added to cart
            </>
          ) : addState === 'adding' ? (
            <>
              <Loader2 size={ICON_SIZE.md} aria-hidden="true" className="mr-2 animate-spin" /> Adding…
            </>
          ) : canPurchase ? (
            `Add to cart — $${displayPrice}`
          ) : (
            'Unavailable'
          )}
        </Button>
        {showShare ? (
          <button
            type="button"
            onClick={() => void shareProduct(product)}
            aria-label={`Share ${product.name}`}
            className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[var(--shop-card-border)] bg-[var(--shop-surface)] text-[var(--shop-text)] transition-colors hover:border-[var(--shop-accent)] hover:text-[var(--shop-accent)]"
          >
            <Share2 size={ICON_SIZE.md} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
