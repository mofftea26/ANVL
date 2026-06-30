import { useRef } from 'react'
import { Container } from '@/shared/components/ui'
import { useCustomerProfileQuery } from '@/features/storefront-account/publicAccount.core'
import { AccountAvatar } from '@/features/storefront-account/account/AccountAvatar'
import { useAccountCarousel } from '@/features/storefront-account/account/useAccountCarousel'
import { PersonalPanel } from '@/features/storefront-account/account/panels/PersonalPanel'
import { AddressesPanel } from '@/features/storefront-account/account/panels/AddressesPanel'
import { OrdersPanel } from '@/features/storefront-account/account/panels/OrdersPanel'
import { SettingsPanel } from '@/features/storefront-account/account/panels/SettingsPanel'
import { cn } from '@/shared/lib/cn'

export const ACCOUNT_TABS = ['personal', 'addresses', 'orders', 'settings'] as const
export type AccountTab = (typeof ACCOUNT_TABS)[number]

const TAB_LABELS: Record<AccountTab, string> = {
  personal: 'Personal',
  addresses: 'Addresses',
  orders: 'Orders',
  settings: 'Settings',
}

/**
 * Modern bento account hub. Four tabs slide horizontally as a GSAP carousel
 * (with a parallax + reveal on the entering panel); each panel is a responsive
 * bento of Higgsfield-backed cards. Tab state is URL-driven (`?tab=`).
 */
export function AccountExperience({
  tab,
  onTabChange,
}: {
  tab: AccountTab
  onTabChange: (tab: AccountTab) => void
}) {
  const { data: customer } = useCustomerProfileQuery()
  const index = Math.max(0, ACCOUNT_TABS.indexOf(tab))
  const scopeRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const pointerStart = useRef<number | null>(null)

  useAccountCarousel(scopeRef, trackRef, index)

  const go = (dir: number) => {
    const next = Math.min(ACCOUNT_TABS.length - 1, Math.max(0, index + dir))
    if (next !== index) onTabChange(ACCOUNT_TABS[next]!)
  }

  const firstName = customer?.firstName || 'athlete'

  return (
    <div ref={scopeRef} className="pb-16 pt-[calc(var(--anvl-header-h)+1.25rem)]">
      <Container>
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[var(--color-line)] pb-6">
          <AccountAvatar name={`${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`} email={customer?.email} src={customer?.avatarUrl} className="h-12 w-12 text-base" />
          <div className="min-w-0">
            <p className="anvl-micro text-[var(--color-accent)]">ANVL Account</p>
            <h1 className="anvl-heading truncate text-2xl font-normal sm:text-3xl">Welcome back, {firstName}</h1>
          </div>
        </div>

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Account sections"
          className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ACCOUNT_TABS.map((t) => {
            const active = t === tab
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onTabChange(t)}
                className={cn(
                  'focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors',
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]'
                    : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]',
                )}
              >
                {TAB_LABELS[t]}
              </button>
            )
          })}
        </div>
      </Container>

      {/* Carousel viewport */}
      <div
        className="mt-6 overflow-hidden"
        onPointerDown={(e) => {
          pointerStart.current = e.clientX
        }}
        onPointerUp={(e) => {
          if (pointerStart.current == null) return
          const dx = e.clientX - pointerStart.current
          pointerStart.current = null
          if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1)
        }}
      >
        <div ref={trackRef} className="flex w-full">
          {ACCOUNT_TABS.map((t) => (
            <section
              key={t}
              data-account-panel
              aria-hidden={t !== tab}
              className="w-full shrink-0"
            >
              <Container className="py-1">
                {t === 'personal' ? <PersonalPanel customer={customer} /> : null}
                {t === 'addresses' ? <AddressesPanel customer={customer} /> : null}
                {t === 'orders' ? <OrdersPanel customer={customer} /> : null}
                {t === 'settings' ? <SettingsPanel customer={customer} /> : null}
              </Container>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
