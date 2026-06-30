import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import {
  effectivePrice,
  variantIsPurchasable,
} from '@/features/products/catalog/storefrontCatalog'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartDrawerStore } from '@/features/cart/store/cartDrawer.store'
import { useProductAnalytics } from '@/features/analytics/hooks/useProductAnalytics'

function disabledSizesForColor(product: Product, colorName: string): ReadonlySet<string> {
  const out = new Set<string>()
  const map = product.shop?.availabilityByColorAndSize[colorName]
  if (map) for (const [label, n] of Object.entries(map)) if (n <= 0) out.add(label)
  return out
}

export function colorHasNoStock(product: Product, colorName: string): boolean {
  const m = product.shop?.availabilityByColorAndSize[colorName]
  if (!m) return false
  return !Object.values(m).some((n) => n > 0)
}

export type PdpAddState = 'idle' | 'adding' | 'added'

/**
 * Single source of truth for the PDP's purchasable variant: colorway, size,
 * quantity, per-color availability, colorway-aware gallery images, pricing, and
 * the add-to-cart action (cart write + analytics + success state + SR
 * announcement). Shared by the gallery, buy panel, colorways section, and the
 * mobile sticky bar so every surface stays in sync.
 */
export function usePdpVariant(product: Product) {
  const { addLine } = useCart()
  const { trackAddToCart } = useProductAnalytics()

  const [colorwayIndex, setColorwayIndex] = useState(0)
  const [size, setSize] = useState(product.sizes[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [addState, setAddState] = useState<PdpAddState>('idle')
  const [announce, setAnnounce] = useState('')
  const resetTimer = useRef<number | null>(null)

  const colorway = product.colorways[colorwayIndex] ?? product.colorways[0]
  const colorName = colorway?.name ?? ''

  const galleryImages = useMemo(() => {
    const byColor = colorName ? product.shop?.imagesByColorName[colorName] : undefined
    return byColor && byColor.length > 0 ? byColor : product.images
  }, [colorName, product.images, product.shop?.imagesByColorName])

  const disabledSizes = useMemo(
    () => disabledSizesForColor(product, colorName),
    [product, colorName],
  )

  // Keep the selected size valid when the colorway's in-stock set changes.
  useEffect(() => {
    if (!disabledSizes.has(size)) return
    const next = product.sizes.find((s) => !disabledSizes.has(s))
    if (next) setSize(next)
  }, [disabledSizes, product.sizes, size])

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
    },
    [],
  )

  const displayPrice = effectivePrice(product)
  const status = product.shop?.storefrontStatus ?? 'available'
  const compareAt = product.shop?.compareAtPrice ?? null
  const saleActive =
    status === 'sale' && typeof compareAt === 'number' && compareAt > displayPrice
  const canPurchase =
    variantIsPurchasable(product, colorwayIndex, size) && !disabledSizes.has(size)
  const heroImageSrc = galleryImages[0]?.src ?? product.images[0]?.src ?? ''

  const add = useCallback(() => {
    if (!canPurchase || addState !== 'idle') return
    setAddState('adding')
    const variantId =
      product.shop?.variantIdByColorAndSize?.[colorName || 'Default']?.[
        size || 'One Size'
      ]
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: displayPrice,
      colorway: colorName,
      size,
      quantity,
      image: heroImageSrc,
      variantId,
    })
    trackAddToCart(product, quantity)
    useCartDrawerStore.getState().openDrawer()
    setAddState('added')
    setAnnounce(`${product.name}, ${colorName || 'one color'}, size ${size}, added to cart.`)
    resetTimer.current = window.setTimeout(() => setAddState('idle'), 1600)
  }, [
    addLine,
    addState,
    canPurchase,
    colorName,
    displayPrice,
    heroImageSrc,
    product,
    quantity,
    size,
    trackAddToCart,
  ])

  return {
    colorway,
    colorwayIndex,
    setColorwayIndex,
    size,
    setSize,
    quantity,
    setQuantity,
    galleryImages,
    disabledSizes,
    displayPrice,
    compareAt,
    saleActive,
    status,
    canPurchase,
    addState,
    announce,
    add,
    heroImageSrc,
  }
}

export type PdpVariant = ReturnType<typeof usePdpVariant>
