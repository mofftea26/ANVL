import { Outlet, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AnvlWordmark } from '@/shared/assets/brand'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import {
  useHydrateStorefrontAccountSession,
  useStorefrontAccountSession,
} from './publicAccount.core'
import { isStorefrontAuthEnabled } from './auth'

/** Premium auth card — used by sign-in / sign-up / forgot-password. */
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
    <div className="relative flex min-h-[80svh] items-center justify-center overflow-hidden px-4 py-16">
      <GrainOverlay />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(52,55,58,0.45), transparent 65%)',
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-8 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.9)]">
        <a href="/" className="focus-ring inline-block no-underline">
          <AnvlWordmark className="h-5 w-auto text-[var(--color-heading)]" />
        </a>
        <h1 className="anvl-heading mt-6 text-3xl font-normal">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
        ) : null}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  )
}

export function AccountMockBanner() {
  return (
    <div
      className="mb-6 rounded-md border border-[color-mix(in_oklab,var(--color-warning)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-4 py-3 text-xs text-[var(--color-text)]"
      role="status"
    >
      <p className="font-semibold uppercase tracking-wide text-[color:var(--color-warning)]">Demo account</p>
      <p className="mt-1 leading-relaxed text-[var(--color-text-muted)]">
        Storefront sign-in is mocked in the browser. Configure Supabase auth to enable real
        accounts (Google / Facebook / Apple + email) — see <code>docs/storefront-auth.md</code>.
      </p>
    </div>
  )
}

const SUBNAV: { href: string; label: string }[] = [
  { href: '/account', label: 'Overview' },
  { href: '/account/personal', label: 'Personal' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/settings', label: 'Settings' },
]

export function AccountSubnav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav
      className="mb-8 flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-5"
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
            className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] no-underline transition-colors ${
              active
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]'
                : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]'
            }`}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

/**
 * Auth guard for /account/*. Redirects signed-out visitors to sign-in, then
 * renders the routed account experience (which provides its own chrome).
 */
export function AccountShellLayout() {
  useHydrateStorefrontAccountSession()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Plain effect, not requestAnimationFrame: rAF callbacks are throttled/
    // suspended in backgrounded or inactive tabs (by spec, in every real
    // browser), which left signed-out visitors who open /account in a
    // background tab stuck on "Loading your account…" indefinitely instead
    // of being redirected to sign-in. useHydrateStorefrontAccountSession's
    // useLayoutEffect already runs synchronously before this commits, so a
    // plain effect is sufficient to let hydration win the race.
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (customerId) return
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
    window.location.assign(`/auth/sign-in?redirect=${redirect}`)
  }, [ready, customerId])

  if (!ready || !customerId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 pt-[calc(var(--anvl-header-h)+4rem)]">
        <p className="anvl-micro text-[var(--color-text-muted)]">Loading your account…</p>
      </div>
    )
  }

  return (
    <>
      {!isStorefrontAuthEnabled() ? (
        <div className="mx-auto max-w-5xl px-4 pt-[calc(var(--anvl-header-h)+1rem)]">
          <AccountMockBanner />
        </div>
      ) : null}
      <Outlet />
    </>
  )
}
