import { Check, Loader2, Plus, X } from '@/shared/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import {
  effectivePrice,
  variantIsPurchasable,
} from '@/features/products/catalog/storefrontCatalog'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartDrawerStore } from '@/features/cart/store/cartDrawer.store'
import { useProductAnalytics } from '@/features/analytics/hooks/useProductAnalytics'
import { SizeSelector } from '@/shared/components/ui/SizeSelector'
import { cn } from '@/shared/lib/cn'

function disabledSizesForColor(product: Product, colorName: string): ReadonlySet<string> {
  const out = new Set<string>()
  const map = product.shop?.availabilityByColorAndSize[colorName]
  if (map) {
    for (const [label, n] of Object.entries(map)) {
      if (n <= 0) out.add(label)
    }
  }
  return out
}

function colorHasNoStock(product: Product, colorName: string): boolean {
  const m = product.shop?.availabilityByColorAndSize[colorName]
  if (!m) return false
  return !Object.values(m).some((n) => n > 0)
}

type AddState = 'idle' | 'adding' | 'added' | 'error'

/**
 * Product-card quick-add. A "+" control opens a contained popover with **color
 * and size** selection (no layout shift). Choosing a color re-derives in-stock
 * sizes while preserving the choice; a product with a single color + size adds
 * directly. Rendered as a SIBLING of the card's navigation Link (never nested),
 * with a click-away backdrop so an open popover never navigates. Reads commerce
 * truth from the catalog, writes through the cart, fires the add-to-cart
 * analytics event (PDP parity), blocks duplicate submits, and announces for SR.
 */
export function ProductCardQuickAdd({ product }: { product: Product }) {
  const { addLine } = useCart()
  const { trackAddToCart } = useProductAnalytics()

  const [colorIndex, setColorIndex] = useState(0)
  const colorway = product.colorways[colorIndex] ?? product.colorways[0]
  const colorName = colorway?.name ?? ''

  const disabledSizes = useMemo(
    () => disabledSizesForColor(product, colorName),
    [product, colorName],
  )
  const firstAvailable = useMemo(
    () => product.sizes.find((s) => !disabledSizes.has(s)) ?? product.sizes[0] ?? 'M',
    [product.sizes, disabledSizes],
  )

  const status = product.shop?.storefrontStatus ?? 'available'
  const soldOut =
    status === 'outOfStock' ||
    status === 'comingSoon' ||
    (product.sizes.length > 0 && product.colorways.every((c) => colorHasNoStock(product, c.name)) &&
      product.colorways.length > 0)
  const needsChoice = product.sizes.length > 1 || product.colorways.length > 1

  const [open, setOpen] = useState(false)
  const [size, setSize] = useState(firstAvailable)
  const [state, setState] = useState<AddState>('idle')
  const [announce, setAnnounce] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Keep the size valid as the selected color changes its in-stock set.
  useEffect(() => {
    setSize((prev) => (disabledSizes.has(prev) ? firstAvailable : prev))
  }, [disabledSizes, firstAvailable])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    panelRef.current
      ?.querySelector<HTMLButtonElement>('button[role="option"]:not([disabled])')
      ?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  const commit = useCallback(
    (chosenColor: string, chosenSize: string) => {
      if (state === 'adding' || state === 'added') return
      if (!variantIsPurchasable(product, colorIndex, chosenSize) || disabledSizes.has(chosenSize)) {
        setState('error')
        setAnnounce('That size is unavailable.')
        return
      }
      setState('adding')
      const variantId =
        product.shop?.variantIdByColorAndSize?.[chosenColor || 'Default']?.[
          chosenSize || 'One Size'
        ]
      addLine({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: effectivePrice(product),
        colorway: chosenColor,
        size: chosenSize,
        quantity: 1,
        image: product.images[0]?.src ?? '',
        variantId,
      })
      trackAddToCart(product, 1)
      useCartDrawerStore.getState().openDrawer()
      setState('added')
      setAnnounce(`${product.name}, ${chosenColor || 'one color'}, size ${chosenSize}, added to cart.`)
      window.setTimeout(() => {
        setState('idle')
        setOpen(false)
      }, 1400)
    },
    [addLine, colorIndex, disabledSizes, product, state, trackAddToCart],
  )

  const onTrigger = () => {
    if (soldOut) return
    if (!needsChoice) {
      commit(colorName, firstAvailable)
      return
    }
    setOpen((v) => !v)
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {open ? (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={close}
          className="pointer-events-auto absolute inset-0 cursor-default"
        />
      ) : null}

      <div className="absolute right-2.5 top-2.5">
        <button
          ref={triggerRef}
          type="button"
          disabled={soldOut}
          aria-haspopup={needsChoice ? 'dialog' : undefined}
          aria-expanded={needsChoice ? open : undefined}
          aria-label={
            soldOut
              ? `${product.name} sold out`
              : needsChoice
                ? `Quick add ${product.name}`
                : `Add ${product.name} to cart`
          }
          onClick={onTrigger}
          className={cn(
            'focus-ring pointer-events-auto grid h-10 w-10 place-items-center rounded-full border backdrop-blur-sm transition-all duration-300',
            'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100',
            soldOut
              ? 'cursor-not-allowed border-[var(--shop-card-border)] bg-[var(--shop-overlay)] text-[var(--shop-text-muted)]'
              : state === 'added'
                ? 'border-[var(--shop-success)] bg-[var(--shop-success)] text-[var(--shop-on-accent)]'
                : 'border-[var(--shop-card-border)] bg-[var(--shop-overlay)] text-[var(--shop-text)] hover:border-[var(--shop-accent)] hover:text-[var(--shop-accent)]',
          )}
        >
          {soldOut ? (
            <span className="anvl-micro text-[0.5rem] uppercase tracking-[0.08em]">Sold</span>
          ) : state === 'adding' ? (
            <Loader2 size={ICON_SIZE.md} aria-hidden="true" className="animate-spin" />
          ) : state === 'added' ? (
            <Check size={ICON_SIZE.md} aria-hidden="true" />
          ) : (
            <Plus size={17} aria-hidden="true" />
          )}
        </button>

        {open && needsChoice ? (
          <div
            ref={panelRef}
            role="dialog"
            aria-label={`Quick add ${product.name}`}
            className="pointer-events-auto absolute right-0 top-12 w-56 rounded-xl border border-[var(--shop-card-border)] bg-[var(--shop-surface)] p-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <p className="anvl-micro text-[0.55rem] tracking-[0.2em] text-[var(--shop-text-muted)]">
                Add to cart
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close quick add"
                className="focus-ring rounded p-0.5 text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>

            {product.colorways.length > 1 ? (
              <div className="mt-2.5">
                <p className="anvl-micro mb-1.5 text-[0.55rem] tracking-[0.16em] text-[var(--shop-text-muted)]">
                  Color — {colorName}
                </p>
                <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Color">
                  {product.colorways.map((c, i) => {
                    const out = colorHasNoStock(product, c.name)
                    const selected = i === colorIndex
                    return (
                      <button
                        key={c.name}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        aria-disabled={out}
                        disabled={out}
                        title={out ? `${c.name} (sold out)` : c.name}
                        onClick={() => setColorIndex(i)}
                        className={cn(
                          'focus-ring relative grid h-7 w-7 place-items-center rounded-full ring-1 transition-transform',
                          out && 'cursor-not-allowed opacity-40',
                          selected ? 'ring-2 ring-[var(--shop-accent)] scale-110' : 'ring-[var(--shop-card-border)] hover:scale-110',
                        )}
                        style={{ backgroundColor: c.base, boxShadow: `inset 0 0 0 2px ${c.accent}33` }}
                      >
                        {selected ? (
                          <Check size={ICON_SIZE.xs} aria-hidden="true" style={{ color: '#fff', mixBlendMode: 'difference' }} />
                        ) : null}
                        <span className="sr-only">{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-2.5">
              <p className="anvl-micro mb-1.5 text-[0.55rem] tracking-[0.16em] text-[var(--shop-text-muted)]">
                Size
              </p>
              <SizeSelector
                sizes={product.sizes}
                value={size}
                disabledSizes={disabledSizes}
                onChange={setSize}
              />
            </div>

            <button
              type="button"
              onClick={() => commit(colorName, size)}
              disabled={disabledSizes.has(size) || state === 'adding' || state === 'added'}
              className={cn(
                'focus-ring mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold uppercase tracking-[0.1em] transition',
                state === 'added'
                  ? 'border-[var(--shop-success)] text-[var(--shop-success)]'
                  : disabledSizes.has(size)
                    ? 'cursor-not-allowed border-[var(--shop-card-border)] text-[var(--shop-text-muted)]'
                    : 'border-[var(--shop-accent)] bg-[var(--shop-accent)] text-[var(--shop-on-accent)] hover:opacity-90',
              )}
            >
              {state === 'added' ? (
                <>
                  <Check size={ICON_SIZE.sm} aria-hidden="true" /> Added
                </>
              ) : state === 'adding' ? (
                <>
                  <Loader2 size={ICON_SIZE.sm} aria-hidden="true" className="animate-spin" /> Adding…
                </>
              ) : (
                <>Add — ${effectivePrice(product)}</>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
