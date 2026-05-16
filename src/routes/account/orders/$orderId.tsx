import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import type { OrderItem } from '@/app/config/accountContracts'
import {
  formatOrderMoney,
  orderPaymentLabel,
  orderStatusLabel,
  useOrderDetailQuery,
} from '@/features/storefront-account'

export const Route = createFileRoute('/account/orders/$orderId')({
  head: () =>
    buildSeoMeta({
      title: 'Order details | ANVL Athletics',
      description: 'View ANVL Athletics order details.',
      path: '/account/orders',
      noIndex: true,
    }),
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const { orderId } = Route.useParams()
  const { data: order, isLoading } = useOrderDetailQuery(orderId)

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading order…</p>
  }

  if (!order) {
    return (
      <div>
        <h2 className="anvl-heading text-3xl">Order</h2>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Order not found.</p>
        <a className="mt-4 inline-block text-sm underline" href="/account/orders">
          Back to orders
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <a className="text-sm text-[var(--color-text-muted)] underline" href="/account/orders">
          ← Orders
        </a>
        <h2 className="anvl-heading mt-4 text-3xl">{order.orderNumber}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Placed {new Date(order.createdAt).toLocaleString('en-LB')} · {orderStatusLabel(order.status)} ·{' '}
          {orderPaymentLabel(order.paymentMethod)}
        </p>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-heading)]">Ship to</h3>
        <address className="mt-2 text-sm not-italic text-[var(--color-text-muted)]">
          {order.shippingAddress.name ? <p>{order.shippingAddress.name}</p> : null}
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.country}
          </p>
          {order.shippingAddress.phone ? <p>{order.shippingAddress.phone}</p> : null}
        </address>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-[var(--color-heading)]">Items</h3>
        <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
          {order.items.map((item: OrderItem) => (
            <li key={item.id} className="flex flex-col gap-1 p-4 text-sm md:flex-row md:justify-between">
              <div>
                <p className="font-medium text-[var(--color-heading)]">{item.title}</p>
                {item.variantLabel ? (
                  <p className="text-[var(--color-text-muted)]">{item.variantLabel}</p>
                ) : null}
                <p className="text-[var(--color-text-muted)]">Qty {item.quantity}</p>
              </div>
              <p className="font-medium">{formatOrderMoney(item.lineTotal, order.totals.currency)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-sm space-y-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-muted)]">Subtotal</span>
          <span>{formatOrderMoney(order.totals.subtotal, order.totals.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-muted)]">Shipping</span>
          <span>{formatOrderMoney(order.totals.shipping, order.totals.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-muted)]">Tax</span>
          <span>{formatOrderMoney(order.totals.tax, order.totals.currency)}</span>
        </div>
        <div className="flex justify-between border-t border-[var(--color-line)] pt-2 font-semibold">
          <span>Total</span>
          <span>{formatOrderMoney(order.totals.total, order.totals.currency)}</span>
        </div>
      </section>
    </div>
  )
}
