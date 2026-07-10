import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CmsLinkItem } from '@/features/cms/navigation/navigation.types'
import { AccountDrawerSection, AccountDrawerSignOut } from '@/features/storefront-account/account/AccountDrawerSection'
import { GlobalSearchBar } from '@/features/search/components/GlobalSearchBar'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Drawer } from '@/shared/components/ui/Drawer'
import { IconButton } from '@/shared/components/ui/IconButton'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * Mobile + tablet navigation drawer. The trigger (burger) and the cart now live
 * in {@link PremiumNavTopbar}; this component is purely the slide-out menu.
 * The topbar drops its avatar trigger below `lg`, so the profile card here
 * (via {@link AccountDrawerSection}) is the only account entry point on small
 * screens — signed-in identity + quick links, or a sign-in CTA.
 */
export function PremiumNavMobile({
  logoSrc,
  drawerLinks,
  open,
  onClose,
}: {
  logoSrc?: string
  drawerLinks: CmsLinkItem[]
  open: boolean
  onClose: () => void
}) {
  const LogoMark: ReactNode = logoSrc?.trim() ? (
    <img
      src={logoSrc.trim()}
      alt="ANVL"
      className="h-9 w-auto max-w-[160px] object-contain"
    />
  ) : (
    <AnvlLogoImage variant="stacked" className="h-9 w-auto" />
  )

  return (
    <Drawer open={open} onClose={onClose} placement="left" aria-label="Mobile navigation">
      <div className="flex items-center justify-between">
        {LogoMark}
        <IconButton onClick={onClose} aria-label="Close navigation menu">
          <X size={ICON_SIZE.md} aria-hidden="true" />
        </IconButton>
      </div>
      <div className="mt-6">
        <GlobalSearchBar variant="drawer" onNavigate={onClose} />
      </div>
      <div className="mt-6">
        <AccountDrawerSection onNavigate={onClose} />
      </div>
      <nav className="mt-8 flex flex-col gap-4" aria-label="Mobile">
        {drawerLinks.map((item) => (
          <SafeLink
            key={`${item.id ?? item.href}-drawer`}
            href={item.href}
            className="anvl-heading focus-ring text-3xl no-underline"
            onClick={onClose}
          >
            {stripAngleBracketTags(item.label)}
          </SafeLink>
        ))}
      </nav>
      <div className="mt-auto">
        <AccountDrawerSignOut onNavigate={onClose} />
      </div>
    </Drawer>
  )
}
