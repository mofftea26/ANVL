import { createFileRoute, Link } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button, Container, Section } from '@/shared/components/ui'

export const Route = createFileRoute('/checkout/success')({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : '',
  }),
  head: () =>
    buildSeoMeta({
      title: 'Order Success | ANVL Athletics',
      description: 'Your order has been placed.',
      path: '/checkout/success',
    }),
  component: CheckoutSuccessPage,
})

function CheckoutSuccessPage() {
  const { orderId } = Route.useSearch()
  return (
    <Section>
      <Container className="max-w-2xl text-center">
        <p className="anvl-micro">Order confirmed</p>
        <h1 className="anvl-heading mt-4 text-7xl">The Oath Is Locked</h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Your order has been placed successfully.
        </p>
        {orderId ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Order ID: {orderId}</p>
        ) : null}
        <div className="mt-8">
          <Link to="/shop" className="no-underline">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </Container>
    </Section>
  )
}
