import { useCallback, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { isInternalCheckoutEnabled } from '@/features/checkout/config/internalCheckout'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCustomerProfileQuery } from '@/features/storefront-account'
import {
  Button,
  Container,
  EmptyState,
  QuantityStepper,
  Section,
} from '@/shared/components/ui'
import { formatMoney } from '@/shared/lib/money'

export const Route = createFileRoute('/cart')({
  head: () =>
    buildSeoMeta({
      title: 'Cart | ANVL Athletics',
      description: 'Review your ANVL Athletics cart before checkout.',
      path: '/cart',
    }),
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const { lines, subtotal, quantity, updateQuantity, removeLine } = useCart()
  const { data: customer } = useCustomerProfileQuery()
  const [checkingOut, setCheckingOut] = useState(false)

  // Prefer Shopify's hosted checkout when the Shopify adapter is active. Pass
  // the signed-in buyer's email so the resulting order links to the account.
  //
  // A failure here must NEVER fall through to the internal /checkout route when
  // Shopify is live: that route runs the mock gateway, which fakes a successful
  // order. `isInternalCheckoutEnabled()` gates the fallback to dev-only,
  // seed/localStorage setups; everywhere else the error is surfaced and the
  // buyer stays on the cart with their lines intact.
  const handleCheckout = useCallback(async () => {
    if (checkingOut) return
    setCheckingOut(true)
    try {
      const url = await runtimeClients.commerce.startCheckout(
        lines,
        customer?.email ? { email: customer.email, countryCode: 'LB' } : undefined,
      )
      if (url) {
        window.location.href = url
        return
      }
      if (isInternalCheckoutEnabled()) {
        setCheckingOut(false)
        void navigate({ to: '/checkout' })
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
  }, [checkingOut, lines, customer?.email, navigate])

  return (
    <Section>
      <Container>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--color-line)] pb-6">
          <h1 className="anvl-heading text-4xl font-normal sm:text-5xl md:text-6xl">Cart</h1>
          {lines.length > 0 ? (
            <p className="anvl-micro text-[var(--color-text-muted)]">
              {quantity} {quantity === 1 ? 'piece' : 'pieces'}
            </p>
          ) : null}
        </div>

        {lines.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No Iron In The Basket"
              description="Your cart is empty. Load Drop 01 and return stronger."
              actionLabel="Explore Shop"
              onAction={() => navigate({ to: '/shop', search: defaultShopUrlSearch })}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <ul className="space-y-4">
              {lines.map((line) => (
                <li
                  key={`${line.productId}:${line.size}:${line.colorway}`}
                  className="grid gap-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[color-mix(in_oklab,var(--color-accent)_30%,var(--color-line))] md:grid-cols-[96px_1fr_auto]"
                >
                  <Link
                    to="/shop/$slug"
                    params={{ slug: line.slug }}
                    className="focus-ring block overflow-hidden rounded-md border border-[var(--color-line)]"
                  >
                    <img
                      src={line.image}
                      alt={`${line.name} in ${line.colorway}`}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to="/shop/$slug"
                      params={{ slug: line.slug }}
                      className="focus-ring no-underline"
                    >
                      <h2 className="anvl-heading break-words text-xl font-normal sm:text-2xl">
                        {line.name}
                      </h2>
                    </Link>
                    <p className="anvl-micro mt-1 text-[var(--color-text-muted)]">
                      {line.colorway} · {line.size}
                    </p>
                    <p className="anvl-heading mt-2 text-base font-normal">{formatMoney(line.price, line.currency)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-3">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(value) =>
                        updateQuantity(line.productId, line.size, line.colorway, value)
                      }
                    />
                    <button
                      className="focus-ring text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-text)]"
                      onClick={() => removeLine(line.productId, line.size, line.colorway)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <p className="anvl-micro text-[var(--color-text-muted)]">Order summary</p>
              <dl className="mt-4 space-y-2 border-b border-[var(--color-line)] pb-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--color-text-muted)]">Subtotal</dt>
                  <dd className="anvl-heading font-normal">{formatMoney(subtotal, lines[0]?.currency)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--color-text-muted)]">Shipping</dt>
                  <dd className="text-[var(--color-text-muted)]">Calculated at checkout</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between">
                <span className="anvl-micro text-[var(--color-text-muted)]">Total</span>
                <span className="anvl-heading text-2xl font-normal">{formatMoney(subtotal, lines[0]?.currency)}</span>
              </div>
              <Button
                className="mt-6 w-full"
                disabled={checkingOut}
                onClick={() => void handleCheckout()}
              >
                {checkingOut ? 'Redirecting to checkout…' : 'Checkout'}
              </Button>
              <p className="anvl-micro mt-3 text-center text-[10px] text-[var(--color-text-muted)]">
                Delivered across Lebanon · Secure checkout
              </p>
            </aside>
          </div>
        )}
      </Container>
    </Section>
  )
}
