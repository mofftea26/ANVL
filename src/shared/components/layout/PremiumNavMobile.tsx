import { ArrowUpRight, X } from 'lucide-react'
import type { CmsLinkItem } from '@/features/cms/navigation/navigation.types'
import { AccountDrawerSection, AccountDrawerSignOut } from '@/features/storefront-account/account/AccountDrawerSection'
import { GlobalSearchBar } from '@/features/search/components/GlobalSearchBar'
import { AnvlWordmark } from '@/shared/assets/brand'
import { Drawer } from '@/shared/components/ui/Drawer'
import { IconButton } from '@/shared/components/ui/IconButton'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * Mobile + tablet navigation drawer. The trigger (burger) and the cart live in
 * {@link PremiumNavTopbar}; this is purely the slide-out menu, built around the
 * account card: wordmark header → the card → search → refined nav rows →
 * sign-out anchored at the bottom.
 */
export function PremiumNavMobile({
  drawerLinks,
  open,
  onClose,
}: {
  logoSrc?: string
  drawerLinks: CmsLinkItem[]
  open: boolean
  onClose: () => void
}) {
  return (
    <Drawer open={open} onClose={onClose} placement="left" aria-label="Mobile navigation">
      <div className="flex items-center justify-between">
        {/* Always the global wordmark — the drawer is site chrome, never
            per-drop branding. */}
        <AnvlWordmark className="h-6 w-auto text-[var(--color-heading)]" />
        <IconButton onClick={onClose} aria-label="Close navigation menu">
          <X size={ICON_SIZE.md} aria-hidden="true" />
        </IconButton>
      </div>

      <div className="mt-6">
        <AccountDrawerSection onNavigate={onClose} />
      </div>

      <div className="mt-4">
        <GlobalSearchBar variant="drawer" onNavigate={onClose} />
      </div>

      {/* Nav — quiet editorial rows: hairline-separated, champagne arrow on
          the active edge. */}
      <nav className="mt-8" aria-label="Mobile">
        {drawerLinks.map((item, i) => (
          <SafeLink
            key={`${item.id ?? item.href}-drawer`}
            href={item.href}
            onClick={onClose}
            className={
              'focus-ring group flex items-center justify-between gap-3 py-3.5 no-underline transition-colors' +
              (i > 0 ? ' border-t border-[color-mix(in_oklab,var(--color-line)_70%,transparent)]' : '')
            }
          >
            <span className="anvl-heading text-2xl text-[var(--color-heading)] transition-colors group-hover:text-[var(--color-highlight-bright)]">
              {stripAngleBracketTags(item.label)}
            </span>
            <ArrowUpRight
              size={16}
              aria-hidden="true"
              className="text-[var(--color-text-muted)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </SafeLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <AccountDrawerSignOut onNavigate={onClose} />
      </div>
    </Drawer>
  )
}
