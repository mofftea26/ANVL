import { Link } from '@tanstack/react-router'
import { Package, ReceiptText } from '@/shared/icons'
import type { Customer } from '@/app/config/accountContracts'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { Button } from '@/shared/components/ui/Button'
import {
  formatOrderMoney,
  orderPaymentLabel,
  orderStatusLabel,
  useOrdersQuery,
} from '@/features/storefront-account/publicAccount.core'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { accountCardBg, type AccountCardBgKey } from '@/features/storefront-account/account/accountCardBg'

const BG_CYCLE: AccountCardBgKey[] = ['carbon', 'steel', 'stone', 'smoke', 'gold', 'ember']

export function OrdersPanel({ customer }: { customer: Customer | undefined }) {
  const { data: orders, isLoading } = useOrdersQuery()
  const list = orders ?? []
  const totalSpent = list.reduce((sum, o) => sum + (o.totals?.total ?? 0), 0)
  const currency = list[0]?.totals?.currency ?? 'USD'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Orders" icon={<Package size={15} />}>
          <p className="anvl-heading mt-1 text-3xl text-[var(--color-heading)]">{list.length}</p>
          <p className="anvl-micro text-[var(--color-text-muted)]">placed</p>
        </AccountBentoCard>
        <AccountBentoCard bg={accountCardBg('gold')} eyebrow="Lifetime">
          <p className="anvl-heading mt-1 text-3xl text-[var(--color-heading)]">
            {formatOrderMoney(totalSpent, currency)}
          </p>
          <p className="anvl-micro text-[var(--color-text-muted)]">total</p>
        </AccountBentoCard>
        <AccountBentoCard bg={accountCardBg('steel')} eyebrow="Member" className="col-span-2 sm:col-span-1">
          <p className="anvl-heading mt-1 truncate text-lg text-[var(--color-heading)]">
            {[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'ANVL athlete'}
          </p>
          <p className="anvl-micro truncate text-[var(--color-text-muted)]">{customer?.email}</p>
        </AccountBentoCard>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading orders…</p>
      ) : list.length === 0 ? (
        <AccountBentoCard bg={accountCardBg('smoke')} eyebrow="No orders yet" icon={<ReceiptText size={15} />} className="items-start">
          <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
            When you place an order it appears here — confirmations, status, and totals. Drop 01 is live.
          </p>
          <Link to="/shop" search={defaultShopUrlSearch} className="mt-4 inline-block">
            <Button>Explore the shop</Button>
          </Link>
        </AccountBentoCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((order, i) => (
            <AccountBentoCard
              key={order.id}
              bg={accountCardBg(BG_CYCLE[i % BG_CYCLE.length]!)}
              eyebrow={order.orderNumber}
              icon={<ReceiptText size={15} />}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-elevated)] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text)]">
                  {orderStatusLabel(order.status)}
                </span>
                <span className="anvl-micro text-[var(--color-text-muted)]">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className="anvl-micro text-[var(--color-text-muted)]">· {orderPaymentLabel(order.paymentMethod)}</span>
              </div>
              <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                {order.items.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="truncate">{item.quantity}× {item.title}{item.variantLabel ? ` · ${item.variantLabel}` : ''}</span>
                    <span className="shrink-0">{formatOrderMoney(item.lineTotal, order.totals.currency)}</span>
                  </li>
                ))}
                {order.items.length > 4 ? (
                  <li className="anvl-micro">+{order.items.length - 4} more</li>
                ) : null}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-2">
                <span className="anvl-micro text-[var(--color-text-muted)]">Total</span>
                <span className="anvl-heading text-[var(--color-heading)]">
                  {formatOrderMoney(order.totals.total, order.totals.currency)}
                </span>
              </div>
            </AccountBentoCard>
          ))}
        </div>
      )}
    </div>
  )
}
