import { Link } from '@tanstack/react-router'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import {
  effectivePrice,
  variantIsPurchasable,
} from '@/features/products/catalog/storefrontCatalog'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartDrawerStore } from '@/features/cart/store/cartDrawer.store'
import { useProductAnalytics } from '@/features/analytics/hooks/useProductAnalytics'
import { useResponsiveShopLayout } from '@/features/products/shop/hooks/useResponsiveShopLayout'
import {
  Button,
  ColorSwatch,
  Drawer,
  Modal,
  SizeSelector,
} from '@/shared/components/ui'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { cn } from '@/shared/lib/cn'

function colorHasNoStock(product: Product, colorName: string): boolean {
  const m = product.shop?.availabilityByColorAndSize[colorName]
  if (!m) return false
  return !Object.values(m).some((n) => n > 0)
}

function disabledSizesForColor(product: Product, colorName: string): ReadonlySet<string> {
  const out = new Set<string>()
  const m = product.shop?.availabilityByColorAndSize[colorName]
  if (m) for (const [label, n] of Object.entries(m)) if (n <= 0) out.add(label)
  return out
}

type AddState = 'idle' | 'adding' | 'added'

/**
 * Quick view — only what's needed to evaluate + add a piece (not the full PDP).
 * Desktop renders a centered modal; mobile renders a full-height bottom sheet
 * with a sticky add-to-cart region. Both reuse the shared dialog primitives, so
 * focus trap, Escape, focus restore, and scroll lock are handled. Add-to-cart
 * writes through the cart store and fires the same analytics event as the PDP.
 */
export function ProductQuickView({
  product,
  open,
  onClose,
}: {
  product: Product | null
  open: boolean
  onClose: () => void
}) {
  const { isDesktop } = useResponsiveShopLayout()
  const { addLine } = useCart()
  const { trackAddToCart } = useProductAnalytics()

  const [colorwayIndex, setColorwayIndex] = useState(0)
  const [size, setSize] = useState('')
  const [state, setState] = useState<AddState>('idle')
  const [announce, setAnnounce] = useState('')
  const resetTimer = useRef<number | null>(null)

  // Reset transient selection whenever a new product opens.
  useEffect(() => {
    if (!product) return
    setColorwayIndex(0)
    setSize(product.sizes[0] ?? '')
    setState('idle')
  }, [product])

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
  }, [])

  const colorway = product?.colorways[colorwayIndex] ?? product?.colorways[0]
  const disabledSizes = useMemo(
    () => (product ? disabledSizesForColor(product, colorway?.name ?? '') : new Set<string>()),
    [product, colorway],
  )

  useEffect(() => {
    if (!product || !disabledSizes.has(size)) return
    const next = product.sizes.find((s) => !disabledSizes.has(s))
    if (next) setSize(next)
  }, [disabledSizes, product, size])

  if (!product || !colorway) return null

  const price = effectivePrice(product)
  const shop = product.shop
  const showCompare =
    typeof shop?.compareAtPrice === 'number' && shop.compareAtPrice > price
  const images = (colorway && shop?.imagesByColorName[colorway.name]) || product.images
  const hero = images[0]?.src ?? product.images[0]?.src ?? ''
  const canPurchase =
    variantIsPurchasable(product, colorwayIndex, size) && !disabledSizes.has(size)

  const add = () => {
    if (!canPurchase || state !== 'idle') return
    setState('adding')
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price,
      colorway: colorway.name,
      size,
      quantity: 1,
      image: hero,
      variantId:
        product.shop?.variantIdByColorAndSize?.[colorway.name || 'Default']?.[size || 'One Size'],
    })
    trackAddToCart(product, 1)
    useCartDrawerStore.getState().openDrawer()
    setState('added')
    setAnnounce(`${product.name}, size ${size}, added to cart.`)
    resetTimer.current = window.setTimeout(() => setState('idle'), 1600)
  }

  const body = (
    <div className="flex flex-col gap-5 md:flex-row">
      <div className="md:w-1/2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-image-bg)]">
          {hero ? (
            <img src={hero} alt={images[0]?.alt ?? product.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {images.slice(0, 4).map((img, i) => (
              <div
                key={`${img.src}-${i}`}
                className="h-16 w-12 shrink-0 overflow-hidden rounded border border-[var(--shop-card-border)] bg-[var(--shop-image-bg)]"
              >
                <img src={img.src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="anvl-micro text-[var(--shop-accent)]">{stripAngleBracketTags(product.dropName)}</p>
        <h2 className="anvl-heading mt-1 text-2xl font-normal leading-tight text-[var(--shop-text)]">
          {stripAngleBracketTags(product.name)}
        </h2>
        <div className="mt-2 flex items-baseline gap-3">
          <p className="anvl-display text-xl text-[var(--shop-text)]">${price}</p>
          {showCompare && shop ? (
            <p className="text-sm text-[var(--shop-text-muted)] line-through">${shop.compareAtPrice}</p>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="anvl-micro mb-2 text-[var(--shop-text-muted)]">Colorway — {colorway.name}</p>
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

        <div className="mt-4">
          <p className="anvl-micro mb-2 text-[var(--shop-text-muted)]">Size</p>
          <SizeSelector sizes={product.sizes} value={size} disabledSizes={disabledSizes} onChange={setSize} />
          <p className="mt-2 text-xs text-[var(--shop-text-muted)]">
            {canPurchase ? 'In stock for this combination.' : 'Not available in this size.'}
          </p>
        </div>

        <div className={cn('mt-5 flex flex-col gap-2', !isDesktop && 'hidden')}>
          <Button type="button" className="w-full" disabled={!canPurchase || state !== 'idle'} onClick={add}>
            {state === 'added' ? (
              <>
                <Check size={16} aria-hidden="true" className="mr-2" /> Added
              </>
            ) : state === 'adding' ? (
              <>
                <Loader2 size={16} aria-hidden="true" className="mr-2 animate-spin" /> Adding…
              </>
            ) : canPurchase ? (
              `Add to cart — $${price}`
            ) : (
              'Unavailable'
            )}
          </Button>
          <Link
            to="/shop/$slug"
            params={{ slug: product.slug }}
            onClick={onClose}
            className="focus-ring text-center text-sm text-[var(--shop-text-muted)] underline-offset-4 hover:text-[var(--shop-accent)] hover:underline"
          >
            View full details
          </Link>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  )

  if (isDesktop) {
    return (
      <Modal open={open} onClose={onClose} title={undefined} aria-label={`Quick view ${product.name}`} className="max-w-3xl">
        {body}
      </Modal>
    )
  }

  return (
    <Drawer open={open} onClose={onClose} placement="bottom" aria-label={`Quick view ${product.name}`}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">{body}</div>
        <div className="sticky bottom-0 -mx-6 -mb-2 flex items-center gap-3 border-t border-[var(--shop-card-border)] bg-[var(--shop-surface)] px-6 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
          <Link
            to="/shop/$slug"
            params={{ slug: product.slug }}
            onClick={onClose}
            className="focus-ring shrink-0 text-sm text-[var(--shop-text-muted)] underline-offset-4 hover:text-[var(--shop-accent)] hover:underline"
          >
            Details
          </Link>
          <Button type="button" className="flex-1" disabled={!canPurchase || state !== 'idle'} onClick={add}>
            {state === 'added' ? 'Added' : canPurchase ? `Add — $${price}` : 'Unavailable'}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
