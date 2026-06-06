import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { buildSeoMeta } from '@/app/seo/meta'
import { useCustomerProfileQuery } from '@/features/storefront-account'

const LINKS = [
  { href: '/account/personal', label: 'Personal info', desc: 'Name and contact details.' },
  { href: '/account/addresses', label: 'Addresses', desc: 'Your shipping destinations.' },
  { href: '/account/orders', label: 'Orders', desc: 'History and tracking.' },
]

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
    return <p className="anvl-micro text-[var(--color-text-muted)]">Loading profile…</p>
  }

  const name =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Member'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <span className="anvl-heading flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] text-2xl font-normal text-[var(--color-accent)]">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="anvl-micro text-[var(--color-accent)]">Welcome back</p>
          <p className="anvl-heading mt-1 truncate text-2xl font-normal">{name}</p>
          {customer?.email ? (
            <p className="truncate text-sm text-[var(--color-text-muted)]">{customer.email}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="group rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 no-underline transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-heading)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="anvl-heading text-lg font-normal text-[var(--color-heading)]">
                {link.label}
              </p>
              <ArrowUpRight
                size={16}
                aria-hidden="true"
                className="shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text)]"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{link.desc}</p>
          </a>
        ))}
      </section>

      <p className="text-xs text-[var(--color-text-muted)]">
        Lebanon checkout supports cash on delivery and Whish Money; card checkout can be enabled later
        for international orders.
      </p>
    </div>
  )
}
