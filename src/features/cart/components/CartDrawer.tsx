import { useCallback, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { runtimeClients } from '@/app/config/runtime'
import { isInternalCheckoutEnabled } from '@/features/checkout/config/internalCheckout'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartDrawerStore } from '@/features/cart/store/cartDrawer.store'
import { getStorefrontUserEmail } from '@/features/storefront-account/auth'
import { Button, Drawer, QuantityStepper } from '@/shared/components/ui'
import { formatMoney } from '@/shared/lib/money'

/**
 * Slide-in mini-cart. Opens on add-to-cart and from the header cart icon. Reuses
 * the same hosted-checkout path as the /cart page (buyer email attached when the
 * customer is signed in).
 */
export function CartDrawer() {
  const open = useCartDrawerStore((s) => s.open)
  const closeDrawer = useCartDrawerStore((s) => s.closeDrawer)
  const { lines, subtotal, quantity, updateQuantity, removeLine } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)

  // Mirrors `routes/cart.tsx`: the internal /checkout route runs the mock
  // gateway, so it is only ever a fallback in dev/seed setups. When Shopify is
  // live a failure is surfaced instead — never silently redirected into a flow
  // that would fake an order confirmation.
  const handleCheckout = useCallback(async () => {
    if (checkingOut) return
    setCheckingOut(true)
    try {
      const email = await getStorefrontUserEmail()
      const url = await runtimeClients.commerce.startCheckout(
        lines,
        email ? { email, countryCode: 'LB' } : undefined,
      )
      if (url) {
        window.location.href = url
        return
      }
      if (isInternalCheckoutEnabled()) {
        closeDrawer()
        window.location.assign('/checkout')
        return
      }
      throw new Error('Checkout did not return a hosted URL.')
    } catch (error) {
      setCheckingOut(false)
      console.error('[checkout] could not start hosted checkout', error)
      toast.error('Checkout is unavailable right now.', {
        description: 'Your cart has been kept. Please try again in a moment.',
      })
    }
  }, [checkingOut, lines, closeDrawer])

  return (
    <Drawer open={open} onClose={closeDrawer} placement="right" title={`Cart · ${quantity}`}>
      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">Your cart is empty.</p>
          <Button variant="secondary" onClick={closeDrawer}>Keep shopping</Button>
        </div>
      ) : (
        <>
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {lines.map((line) => (
              <li
                key={`${line.productId}:${line.size}:${line.colorway}`}
                className="grid grid-cols-[64px_1fr] gap-3 rounded-md border border-[var(--color-line)] p-2"
              >
                <Link
                  to="/shop/$slug"
                  params={{ slug: line.slug }}
                  onClick={closeDrawer}
                  className="focus-ring block overflow-hidden rounded"
                >
                  <img src={line.image} alt={line.name} className="aspect-square w-full object-contain" loading="lazy" />
                </Link>
                <div className="min-w-0">
                  <p className="anvl-heading truncate text-sm">{line.name}</p>
                  <p className="anvl-micro text-[var(--color-text-muted)]">{line.colorway} · {line.size}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(v) => updateQuantity(line.productId, line.size, line.colorway, v)}
                    />
                    <span className="anvl-heading text-sm">{formatMoney(line.price * line.quantity, line.currency)}</span>
                  </div>
                  <button
                    className="focus-ring mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)] underline underline-offset-4 hover:text-[var(--color-text)]"
                    onClick={() => removeLine(line.productId, line.size, line.colorway)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 shrink-0 border-t border-[var(--color-line)] pt-4">
            <div className="flex items-center justify-between">
              <span className="anvl-micro text-[var(--color-text-muted)]">Subtotal</span>
              <span className="anvl-heading text-xl">{formatMoney(subtotal, lines[0]?.currency)}</span>
            </div>
            <Button className="mt-4 w-full" disabled={checkingOut} onClick={() => void handleCheckout()}>
              {checkingOut ? 'Redirecting…' : 'Checkout'}
            </Button>
            <Link
              to="/cart"
              onClick={closeDrawer}
              className="focus-ring mt-2 block text-center text-xs text-[var(--color-text-muted)] underline underline-offset-4 hover:text-[var(--color-text)]"
            >
              View full cart
            </Link>
          </div>
        </>
      )}
    </Drawer>
  )
}
