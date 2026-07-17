import { useLayoutEffect, useRef, useState } from 'react'
import { MapPin, Package, Settings, Shield, UserRound } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { ACCOUNT_TABS, type AccountTab } from '@/features/storefront-account/account/accountTabs'

const TAB_LABELS: Record<AccountTab, string> = {
  personal: 'Personal',
  addresses: 'Addresses',
  orders: 'Orders',
  armory: 'Armory',
  settings: 'Settings',
}

const TAB_ICONS: Record<AccountTab, typeof UserRound> = {
  personal: UserRound,
  addresses: MapPin,
  orders: Package,
  armory: Shield,
  settings: Settings,
}

/**
 * Account section navigation, two devices, two idioms:
 *  - ≥ sm: the segmented control with a sliding active pill (measured against
 *    the DOM, animated via CSS transform/width transitions).
 *  - phones: an app-style FIXED BOTTOM BAR — icons + labels in thumb reach,
 *    no horizontal scrolling. (The account shell reserves bottom padding.)
 */
export function AccountTabBar({
  tab,
  onTabChange,
}: {
  tab: AccountTab
  onTabChange: (tab: AccountTab) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const active = container?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)
    if (!container || !active) return

    const measure = () => {
      const cRect = container.getBoundingClientRect()
      const aRect = active.getBoundingClientRect()
      setIndicator({ left: aRect.left - cRect.left, width: aRect.width })
    }
    measure()

    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [tab])

  return (
    <>
      {/* ≥ sm: segmented control with the sliding pill. */}
      <div
        ref={containerRef}
        role="tablist"
        aria-label="Account sections"
        className="relative hidden gap-1 overflow-x-auto rounded-full border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)] p-1 [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden"
      >
        {indicator ? (
          <span
            aria-hidden="true"
            className="absolute bottom-1 top-1 rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_18px_-8px_color-mix(in_oklab,var(--color-highlight)_70%,transparent)] transition-[left,width] duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
        ) : null}
        {ACCOUNT_TABS.map((t) => {
          const Icon = TAB_ICONS[t]
          const active = t === tab
          return (
            <button
              key={t}
              data-tab={t}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onTabChange(t)}
              className={cn(
                'focus-ring relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200',
                active
                  ? 'text-[color:var(--color-on-highlight)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              <Icon size={13} aria-hidden="true" />
              {TAB_LABELS[t]}
            </button>
          )
        })}
      </div>

      {/* Phones: fixed bottom bar, app-style. z-40 sits above content but
          below sheets (z-85) and modals (z-90). */}
      <nav
        aria-label="Account sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        <div role="tablist" aria-label="Account sections" className="flex">
          {ACCOUNT_TABS.map((t) => {
            const Icon = TAB_ICONS[t]
            const active = t === tab
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onTabChange(t)}
                className={cn(
                  'focus-ring flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-200',
                  active
                    ? 'text-[var(--color-highlight-bright)]'
                    : 'text-[var(--color-text-muted)]',
                )}
              >
                <Icon size={19} aria-hidden="true" />
                <span className="truncate text-[9px] font-semibold uppercase tracking-[0.1em]">
                  {TAB_LABELS[t]}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 w-6 rounded-full transition-opacity duration-200',
                    active ? 'bg-[var(--color-highlight-bright)] opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
