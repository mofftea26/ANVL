import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { useCustomerProfileQuery } from '@/features/storefront-account'

export const Route = createFileRoute('/account/')({
  head: () =>
    buildSeoMeta({
      title: 'Account | ANVL Athletics',
      description: 'Your ANVL Athletics account overview.',
      path: '/account',
      noIndex: true,
    }),
  component: AccountOverviewPage,
})

function AccountOverviewPage() {
  const { data: customer, isLoading } = useCustomerProfileQuery()

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading profile…</p>
  }

  const name =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Member'

  return (
    <div className="space-y-8">
      <section>
        <h2 className="anvl-heading text-2xl">Welcome back</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Signed in as <span className="font-medium text-[var(--color-heading)]">{name}</span>
          {customer?.email ? (
            <>
              {' '}
              · <span className="text-[var(--color-heading)]">{customer.email}</span>
            </>
          ) : null}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <a
          href="/account/personal"
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm font-medium text-[var(--color-heading)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-heading)]"
        >
          Personal info
        </a>
        <a
          href="/account/addresses"
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm font-medium text-[var(--color-heading)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-heading)]"
        >
          Addresses
        </a>
        <a
          href="/account/orders"
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm font-medium text-[var(--color-heading)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-heading)] sm:col-span-2"
        >
          Orders
        </a>
      </section>

      <p className="text-xs text-[var(--color-text-muted)]">
        Lebanon checkout supports cash on delivery and Whish Money; card checkout can be enabled later for
        international orders.
      </p>
    </div>
  )
}
