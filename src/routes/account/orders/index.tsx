import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import type { Order } from '@/app/config/accountContracts'
import {
  formatOrderMoney,
  orderPaymentLabel,
  orderStatusLabel,
  useOrdersQuery,
} from '@/features/storefront-account'

export const Route = createFileRoute('/account/orders/')({
  head: () =>
    buildSeoMeta({
      title: 'Orders | ANVL Athletics',
      description: 'View your ANVL Athletics order history.',
      path: '/account/orders',
      noIndex: true,
    }),
  component: OrdersListPage,
})

function OrdersListPage() {
  const { data: orders, isLoading } = useOrdersQuery()

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading orders…</p>
  }

  if (!orders?.length) {
    return (
      <div>
        <h2 className="anvl-heading text-3xl">Orders</h2>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">No orders yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="anvl-heading text-3xl">Orders</h2>
      <ul className="mt-6 space-y-3">
        {orders.map((o: Order) => (
          <li key={o.id}>
            <a
              href={`/account/orders/${o.id}`}
              className="flex flex-col gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-heading)] md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-[var(--color-heading)]">{o.orderNumber}</p>
                <p className="text-[var(--color-text-muted)]">
                  {new Date(o.createdAt).toLocaleDateString('en-LB')} · {orderStatusLabel(o.status)}
                </p>
              </div>
              <p className="font-medium">
                {formatOrderMoney(o.totals.total, o.totals.currency)} · {orderPaymentLabel(o.paymentMethod)}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
