import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LogOut, Package, Settings, Shield, UserRound } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import type { Customer } from '@/app/config/accountContracts'
import {
  useHydrateStorefrontAccountSession,
  useStorefrontAccountSession,
} from '@/features/storefront-account/publicAccount.core'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AccountAvatar } from '@/features/storefront-account/account/AccountAvatar'
import { RankBadge } from '@/features/passport/components/RankBadge'

/**
 * Top-bar account control. Signed out → a round sign-in button. Signed in → a
 * round avatar that opens a modern dropdown with the user's identity, quick
 * links, and sign-out. Auth state is client-only, so it renders the signed-out
 * affordance on the server and reconciles after mount (no hydration mismatch).
 */
export function AccountMenu({ triggerClassName }: { triggerClassName?: string }) {
  useHydrateStorefrontAccountSession()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const logout = useStorefrontAccountSession((s) => s.logout)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => setMounted(true), [])

  // Lazy profile fetch (no React Query) so the topbar stays render-context-light.
  useEffect(() => {
    if (!customerId) {
      setCustomer(null)
      return
    }
    let active = true
    void (async () => {
      try {
        const { runtimeClients } = await import('@/app/config/runtime')
        const c = await runtimeClients.account.getCustomerProfile()
        if (active) setCustomer(c)
      } catch {
        /* ignore — avatar falls back to initials */
      }
    })()
    return () => {
      active = false
    }
  }, [customerId])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Signed out (and during SSR/first paint): a round sign-in button.
  if (!mounted || !customerId) {
    return (
      <Link to="/auth/sign-in" aria-label="Sign in" data-native-cursor className={triggerClassName}>
        <UserRound size={ICON_SIZE.md} aria-hidden="true" />
      </Link>
    )
  }

  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Your account'

  const itemClass =
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--color-text)] no-underline transition-colors hover:bg-[var(--color-surface-elevated)] focus-ring'

  return (
    <div ref={ref} className="relative">
      {/* Trigger keeps the landing page's special cursor — only the open dropdown
          panel below switches to the native cursor. */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(triggerClassName, 'overflow-hidden p-0')}
      >
        <AccountAvatar
          firstName={customer?.firstName}
          lastName={customer?.lastName}
          email={customer?.email}
          src={customer?.avatarUrl}
          className="h-full w-full text-[0.7rem]"
        />
      </button>

      {open ? (
        <div
          role="menu"
          data-native-cursor
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--color-line)] px-3 pb-3 pt-2">
            <AccountAvatar
              firstName={customer?.firstName}
              lastName={customer?.lastName}
              email={customer?.email}
              src={customer?.avatarUrl}
              className="h-10 w-10 text-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="anvl-heading truncate text-sm text-[var(--color-heading)]">{name}</p>
              <p className="anvl-micro truncate text-[var(--color-text-muted)]">{customer?.email}</p>
            </div>
            <RankBadge className="ml-auto" />
          </div>
          <div className="py-1.5">
            <Link to="/account" search={{ tab: 'personal' }} className={itemClass} onClick={() => setOpen(false)} role="menuitem">
              <UserRound size={17} aria-hidden="true" /> My account
            </Link>
            <Link to="/account" search={{ tab: 'orders' }} className={itemClass} onClick={() => setOpen(false)} role="menuitem">
              <Package size={17} aria-hidden="true" /> Orders
            </Link>
            <Link to="/account" search={{ tab: 'armory' }} className={itemClass} onClick={() => setOpen(false)} role="menuitem">
              <Shield size={17} aria-hidden="true" /> Armory
            </Link>
            <Link to="/account" search={{ tab: 'settings' }} className={itemClass} onClick={() => setOpen(false)} role="menuitem">
              <Settings size={17} aria-hidden="true" /> Settings
            </Link>
          </div>
          <div className="border-t border-[var(--color-line)] pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                logout()
                window.location.assign('/')
              }}
              className={cn(itemClass, 'w-full text-left text-[color:var(--color-danger)]')}
            >
              <LogOut size={17} aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
