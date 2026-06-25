import { Check, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import {
  effectivePrice,
  variantIsPurchasable,
} from '@/features/products/catalog/storefrontCatalog'
import { useCart } from '@/features/cart/hooks/useCart'
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

type AddState = 'idle' | 'added' | 'error'

/**
 * Compact quick-add for the Theoath Modern card. A small "+" control on the media
 * corner opens a contained size popover (absolutely positioned — no layout
 * shift). Rendered as a SIBLING of the card's navigation `<Link>` (never nested),
 * with a click-away backdrop so an open popover never triggers navigation. Reads
 * commerce truth (availability, price) from the catalog; writes through the cart
 * store; announces additions for screen readers. Reduced motion is handled by
 * the global CSS clamp.
 */
export function ProductCardQuickAdd({ product }: { product: Product }) {
  const { addLine } = useCart()
  const colorway = product.colorways[0]
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
    (product.sizes.length > 0 && product.sizes.every((s) => disabledSizes.has(s)))

  const [open, setOpen] = useState(false)
  const [size, setSize] = useState(firstAvailable)
  const [state, setState] = useState<AddState>('idle')
  const [announce, setAnnounce] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

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

  const canPurchase = variantIsPurchasable(product, 0, size) && !disabledSizes.has(size)

  const add = useCallback(() => {
    if (!canPurchase) {
      setState('error')
      setAnnounce('That size is unavailable.')
      return
    }
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: effectivePrice(product),
      colorway: colorName,
      size,
      quantity: 1,
      image: product.images[0]?.src ?? '',
    })
    setState('added')
    setAnnounce(`${product.name}, size ${size}, added to cart.`)
    window.setTimeout(() => {
      setState('idle')
      setOpen(false)
    }, 1500)
  }, [addLine, canPurchase, colorName, product, size])

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* Click-away backdrop (open only) — closes the popover, blocks navigation. */}
      {open ? (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={close}
          className="pointer-events-auto absolute inset-0 cursor-default"
        />
      ) : null}

      <div className="absolute right-2 top-2">
        <button
          ref={triggerRef}
          type="button"
          disabled={soldOut}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={soldOut ? `${product.name} sold out` : `Quick add ${product.name}`}
          onClick={() => (soldOut ? undefined : setOpen((v) => !v))}
          className={cn(
            'focus-ring pointer-events-auto grid h-9 w-9 place-items-center rounded-md border backdrop-blur-sm transition-all duration-300',
            // Always tappable on touch; reveal on hover/focus on desktop.
            'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100',
            soldOut
              ? 'cursor-not-allowed border-[var(--color-line)] bg-[var(--color-overlay)] text-[color:var(--color-text-muted)]'
              : 'border-[var(--border-strong)] bg-[var(--glass-surface)] text-[color:var(--color-text)] hover:border-[var(--color-highlight)] hover:text-[color:var(--color-highlight-bright)]',
          )}
        >
          {soldOut ? (
            <span className="anvl-micro text-[0.5rem] uppercase tracking-[0.1em]">Sold</span>
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
        </button>

        {open ? (
          <div
            ref={panelRef}
            role="dialog"
            aria-label={`Quick add ${product.name}`}
            className="pointer-events-auto absolute right-0 top-11 w-44 rounded-md border border-[var(--border-strong)] bg-[var(--glass-surface)] p-3 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <p className="anvl-micro text-[0.55rem] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                Size
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close quick add"
                className="focus-ring rounded p-0.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2">
              <SizeSelector
                sizes={product.sizes}
                value={size}
                disabledSizes={disabledSizes}
                onChange={setSize}
              />
            </div>
            <button
              type="button"
              onClick={add}
              disabled={!canPurchase || state === 'added'}
              className={cn(
                'focus-ring mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border text-xs font-semibold uppercase tracking-[0.1em] transition',
                state === 'added'
                  ? 'border-[var(--color-success)] text-[color:var(--color-success)]'
                  : canPurchase
                    ? 'border-[var(--color-highlight)] bg-[var(--color-highlight)] text-[color:var(--color-on-highlight)] hover:opacity-90'
                    : 'cursor-not-allowed border-[var(--color-line)] text-[color:var(--color-text-muted)]',
              )}
            >
              {state === 'added' ? (
                <>
                  <Check size={14} aria-hidden="true" /> Added
                </>
              ) : state === 'error' ? (
                'Unavailable'
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
