import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CmsLinkItem } from '@/features/cms/navigation/navigation.types'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Drawer } from '@/shared/components/ui/Drawer'
import { IconButton } from '@/shared/components/ui/IconButton'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'

/**
 * Mobile + tablet navigation drawer. The trigger (burger) and the cart now live
 * in {@link PremiumNavTopbar}; this component is purely the slide-out menu — there
 * is no longer a fixed bottom bar.
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
          <X size={16} aria-hidden="true" />
        </IconButton>
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
    </Drawer>
  )
}
