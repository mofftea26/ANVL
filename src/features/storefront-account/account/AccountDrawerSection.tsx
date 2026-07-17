import { Link } from '@tanstack/react-router'
import { LogOut, Package, Settings, Shield, UserRound } from 'lucide-react'
import {
  useCustomerProfileQuery,
  useHydrateStorefrontAccountSession,
  useStorefrontAccountSession,
} from '@/features/storefront-account/publicAccount.core'
import { AccountAvatar } from '@/features/storefront-account/account/AccountAvatar'
import { RankBadge } from '@/features/passport/components/RankBadge'

const linkChip =
  'focus-ring inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)] no-underline transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'

/**
 * Profile card for the mobile/tablet nav drawer. On small screens the topbar
 * drops the avatar trigger (burger + cart only — see `PremiumNavTopbar`), so
 * this card is the only account entry point below `lg`: identity + quick
 * links when signed in, a sign-in CTA when signed out.
 */
export function AccountDrawerSection({ onNavigate }: { onNavigate?: () => void }) {
  useHydrateStorefrontAccountSession()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const { data: customer } = useCustomerProfileQuery()

  if (!customerId) {
    return (
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)]">
        <p className="anvl-heading text-lg text-[var(--color-heading)]">Your account</p>
        <p className="anvl-micro mt-1 text-[var(--color-text-muted)]">
          Sign in to track orders, save your sizes, and check out faster.
        </p>
        <Link
          to="/auth/sign-in"
          onClick={onNavigate}
          className="focus-ring mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Your account'

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-3">
        <AccountAvatar
          firstName={customer?.firstName}
          lastName={customer?.lastName}
          email={customer?.email}
          src={customer?.avatarUrl}
          className="h-12 w-12 shrink-0 text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="anvl-heading truncate text-base leading-tight text-[var(--color-heading)]">{name}</p>
          <p className="anvl-micro truncate text-[var(--color-text-muted)]">{customer?.email}</p>
        </div>
        <RankBadge className="ml-auto" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/account" search={{ tab: 'personal' }} onClick={onNavigate} className={linkChip}>
          <UserRound size={13} aria-hidden="true" /> My account
        </Link>
        <Link to="/account" search={{ tab: 'orders' }} onClick={onNavigate} className={linkChip}>
          <Package size={13} aria-hidden="true" /> Orders
        </Link>
        <Link to="/account" search={{ tab: 'armory' }} onClick={onNavigate} className={linkChip}>
          <Shield size={13} aria-hidden="true" /> Armory
        </Link>
        <Link to="/account" search={{ tab: 'settings' }} onClick={onNavigate} className={linkChip}>
          <Settings size={13} aria-hidden="true" /> Settings
        </Link>
      </div>
    </div>
  )
}

/**
 * Sign-out control for the nav drawer — deliberately rendered outside/below
 * the profile card (see `PremiumNavMobile`) rather than as part of it, so it
 * reads as a standing drawer-level action rather than a card action. Renders
 * nothing when signed out.
 */
export function AccountDrawerSignOut({ onNavigate }: { onNavigate?: () => void }) {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const logout = useStorefrontAccountSession((s) => s.logout)

  if (!customerId) return null

  return (
    <div className="border-t border-[color-mix(in_oklab,var(--color-line)_70%,transparent)] pt-4">
      <button
        type="button"
        onClick={() => {
          onNavigate?.()
          logout()
          window.location.assign('/')
        }}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[color:var(--color-danger)]"
      >
        <LogOut size={14} aria-hidden="true" /> Sign out
      </button>
    </div>
  )
}
