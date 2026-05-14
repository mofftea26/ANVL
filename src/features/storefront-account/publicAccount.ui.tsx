import { Outlet, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  useHydrateStorefrontAccountSession,
  useStorefrontAccountSession,
} from './publicAccount.core'

export function AuthPageChrome({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="anvl-heading text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-[var(--color-text-muted)]">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  )
}

export function AccountMockBanner() {
  return (
    <div
      className="mb-6 rounded-xl border border-amber-700/35 bg-amber-950/25 px-4 py-3 text-xs text-amber-50/95"
      role="status"
    >
      <p className="font-semibold uppercase tracking-wide text-amber-100/90">Demo account</p>
      <p className="mt-1 leading-relaxed text-[var(--color-text-muted)]">
        Storefront sign-in is mocked in the browser only. TODO: Medusa customer auth with httpOnly sessions
        or a trusted provider — never ship real credentials like this.
      </p>
    </div>
  )
}

const SUBNAV: { href: string; label: string }[] = [
  { href: '/account', label: 'Overview' },
  { href: '/account/personal', label: 'Personal' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/orders', label: 'Orders' },
]

export function AccountSubnav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav
      className="mb-8 flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-4"
      aria-label="Account sections"
    >
      {SUBNAV.map((item) => {
        const isRoot = item.href === '/account'
        const active =
          pathname === item.href || (!isRoot && pathname.startsWith(item.href))
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-heading)] ${
              active
                ? 'bg-[var(--color-surface)] text-[var(--color-heading)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-heading)]'
            }`}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

export function AccountShellLayout() {
  useHydrateStorefrontAccountSession()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const logout = useStorefrontAccountSession((s) => s.logout)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (customerId) return
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
    window.location.assign(`/auth/sign-in?redirect=${redirect}`)
  }, [ready, customerId])

  if (!ready || !customerId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-[var(--color-text-muted)]">Loading your account…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <AccountMockBanner />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="anvl-heading text-4xl">Account</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Profile, addresses, and orders — Lebanon-first delivery and payment options at checkout.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-heading)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-heading)]"
          onClick={() => {
            logout()
            window.location.assign('/auth/sign-in')
          }}
        >
          Sign out
        </button>
      </div>
      <AccountSubnav />
      <Outlet />
    </div>
  )
}
