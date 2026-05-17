import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { buildSeoMeta } from '@/app/seo/meta'
import { useCart } from '@/features/cart/hooks/useCart'
import {
  Button,
  Container,
  EmptyState,
  QuantityStepper,
  Section,
} from '@/shared/components/ui'

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
  const { lines, subtotal, updateQuantity, removeLine } = useCart()

  return (
    <Section>
      <Container>
        <h1 className="anvl-heading text-4xl sm:text-5xl md:text-6xl">Cart</h1>
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
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {lines.map((line) => (
                <article
                  key={`${line.productId}:${line.size}:${line.colorway}`}
                  className="grid gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 md:grid-cols-[90px_1fr_auto]"
                >
                  <img src={line.image} alt={`${line.name} in ${line.colorway}`} className="aspect-square w-full rounded-md object-cover" />
                  <div className="min-w-0">
                    <h2 className="anvl-heading break-words text-2xl sm:text-3xl">
                      {line.name}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">{line.colorway} / {line.size}</p>
                    <p className="mt-1 text-sm">${line.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(value) => updateQuantity(line.productId, line.size, line.colorway, value)}
                    />
                    <button
                      className="text-xs text-[var(--color-text-muted)] underline"
                      onClick={() => removeLine(line.productId, line.size, line.colorway)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="h-fit rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <p className="anvl-micro">Subtotal</p>
              <p className="mt-2 text-3xl font-semibold">${subtotal.toFixed(2)}</p>
              <Button className="mt-5 w-full" onClick={() => navigate({ to: '/checkout' })}>
                Checkout
              </Button>
            </aside>
          </div>
        )}
      </Container>
    </Section>
  )
}
