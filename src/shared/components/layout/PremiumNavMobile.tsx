import { Link } from '@tanstack/react-router'
import { Menu, ShoppingBag, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CmsLinkItem } from '@/features/cms/landing/landingPageCms.types'
import { useCart } from '@/features/cart/hooks/useCart'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Drawer } from '@/shared/components/ui/Drawer'
import { IconButton } from '@/shared/components/ui/IconButton'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'

export function PremiumNavMobile({
  logoSrc,
  drawerLinks,
  showCart,
  open,
  onOpen,
  onClose,
}: {
  logoSrc?: string
  drawerLinks: CmsLinkItem[]
  showCart: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const { quantity } = useCart()

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
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-line)] bg-[rgba(11,11,12,0.95)] px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),12px)] backdrop-blur-md md:hidden"
        data-premium-mobile-bar
      >
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="focus-ring inline-flex shrink-0 items-center text-[var(--color-heading)]"
          >
            {LogoMark}
          </Link>
          <div className="flex items-center gap-2">
            {showCart ? (
              <Link
                to="/cart"
                className="focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]"
                aria-label={`Cart, ${quantity} items`}
              >
                <ShoppingBag size={16} aria-hidden="true" />
                <span className="absolute -right-1 -top-1 min-w-[1.125rem] rounded-full bg-[var(--color-accent)] px-1.5 text-center text-[10px] font-medium text-[var(--color-bg)]">
                  {quantity}
                </span>
              </Link>
            ) : null}
            <IconButton onClick={onOpen} aria-label="Open mobile navigation">
              <Menu size={16} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </div>

      <Drawer open={open} onClose={onClose} placement="left" aria-label="Mobile navigation">
        <div className="flex items-center justify-between">
          {LogoMark}
          <IconButton onClick={onClose} aria-label="Close mobile navigation">
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
    </>
  )
}
