import { useRef } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button, Container } from '@/shared/components/ui'
import { useCustomerProfileQuery } from '@/features/storefront-account/publicAccount.core'
import { AccountAvatar } from '@/features/storefront-account/account/AccountAvatar'
import { AccountTabBar } from '@/features/storefront-account/account/AccountTabBar'
import { ACCOUNT_TABS, type AccountTab } from '@/features/storefront-account/account/accountTabs'
import { useAccountCarousel } from '@/features/storefront-account/account/useAccountCarousel'
import { useAccountSaveStore } from '@/features/storefront-account/account/accountSave.store'
import { PersonalPanel } from '@/features/storefront-account/account/panels/PersonalPanel'
import { AddressesPanel } from '@/features/storefront-account/account/panels/AddressesPanel'
import { OrdersPanel } from '@/features/storefront-account/account/panels/OrdersPanel'
import { SettingsPanel } from '@/features/storefront-account/account/panels/SettingsPanel'

export { ACCOUNT_TABS, type AccountTab } from '@/features/storefront-account/account/accountTabs'

/**
 * Modern bento account hub. Four tabs slide horizontally as a GSAP carousel
 * (parallax + reveal on the entering panel); each panel is a responsive bento of
 * Higgsfield-backed cards. The header is sticky directly under the top bar
 * (shares its translucent scrim), and the active panel's save is a single icon
 * button there. Tab state is URL-driven (`?tab=`).
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
  const saveEntry = useAccountSaveStore((s) => s.entries[tab])

  useAccountCarousel(scopeRef, trackRef, index)

  const go = (dir: number) => {
    const next = Math.min(ACCOUNT_TABS.length - 1, Math.max(0, index + dir))
    if (next !== index) onTabChange(ACCOUNT_TABS[next]!)
  }

  const firstName = customer?.firstName || 'athlete'

  return (
    <div ref={scopeRef} className="pb-16">
      {/* Sticky header — sits flush under the top bar, shares its scrim, with a
          separator line between them. */}
      <div className="sticky top-[var(--anvl-header-h)] z-30 border-t border-b border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-bg)_86%,transparent)] backdrop-blur-md">
        <Container className="flex flex-col gap-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <AccountAvatar
                firstName={customer?.firstName}
                lastName={customer?.lastName}
                email={customer?.email}
                src={customer?.avatarUrl}
                className="h-10 w-10 text-sm sm:h-11 sm:w-11"
              />
              <div className="min-w-0">
                <p className="anvl-micro text-[var(--color-accent)]">ANVL Account</p>
                <h1 className="anvl-heading truncate text-lg font-normal sm:text-xl">
                  Welcome back, {firstName}
                </h1>
              </div>
            </div>

            {saveEntry ? (
              <Button
                type="button"
                size="icon"
                onClick={saveEntry.submit}
                disabled={saveEntry.pending}
                aria-label={saveEntry.pending ? 'Saving changes' : 'Save changes'}
              >
                {saveEntry.pending ? (
                  <Loader2 size={17} aria-hidden="true" className="animate-spin" />
                ) : (
                  <Save size={17} aria-hidden="true" />
                )}
              </Button>
            ) : null}
          </div>

          <AccountTabBar tab={tab} onTabChange={onTabChange} />
        </Container>
      </div>

      {/* Carousel viewport */}
      <div
        className="mt-5 overflow-hidden"
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
            <section key={t} data-account-panel aria-hidden={t !== tab} className="w-full shrink-0">
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
