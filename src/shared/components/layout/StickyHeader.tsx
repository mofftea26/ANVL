import { Link } from '@tanstack/react-router'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { LandingNavigationContent } from '@/features/admin/landing-cms/landingCms.types'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { useStickyHeader } from '@/shared/hooks/useStickyHeader'
import { useCart } from '@/features/cart/hooks/useCart'
import { cn } from '@/shared/lib/cn'
import { Container } from '@/shared/components/ui/Container'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Drawer } from '@/shared/components/ui/Drawer'
import { SafeLink } from '@/shared/components/ui/SafeLink'

export function StickyHeader({
  navigation,
}: {
  navigation: LandingNavigationContent
}) {
  const isSolid = useStickyHeader()
  const [open, setOpen] = useState(false)
  const { quantity } = useCart()

  const visibleLinks = useMemo(
    () =>
      (navigation.headerLinks ?? []).filter((link) => link.isVisible !== false),
    [navigation.headerLinks],
  )

  const extraMobile = useMemo(
    () =>
      (navigation.mobileExtraLinks ?? []).filter(
        (link) => link.isVisible !== false,
      ),
    [navigation.mobileExtraLinks],
  )

  const drawerLinks = useMemo(
    () => [...visibleLinks, ...extraMobile],
    [visibleLinks, extraMobile],
  )

  const showCart = navigation.cartVisible !== false
  const logoSrc = navigation.headerLogoSrc?.trim()
  const announcement = navigation.announcement

  const LogoMark = (
    <>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt="ANVL"
          className="h-12 w-auto max-w-[200px] object-contain md:h-[3.25rem]"
          fetchPriority="high"
        />
      ) : (
        <AnvlLogoImage
          variant="stacked"
          className="h-12 w-auto md:h-[3.25rem]"
          fetchPriority="high"
        />
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-40">
      {announcement?.enabled && announcement.message.trim() ? (
        <div className="border-b border-[var(--color-line)] bg-[var(--color-accent)]/10 py-2 text-center text-[11px] text-[var(--color-text-muted)]">
          <Container>
            {announcement.href ? (
              <SafeLink
                href={announcement.href}
                className="focus-ring font-medium text-[var(--color-heading)] underline-offset-4 hover:underline"
              >
                {announcement.message}
              </SafeLink>
            ) : (
              <span>{announcement.message}</span>
            )}
          </Container>
        </div>
      ) : null}

      <div
        className={cn(
          'border-b transition',
          isSolid
            ? 'border-[var(--color-line)] bg-[rgba(11,11,12,0.92)] backdrop-blur-md'
            : 'border-transparent bg-transparent',
        )}
      >
        <Container className="flex h-16 items-center gap-3">
          <Link
            to="/"
            className="inline-flex shrink-0 items-center text-[var(--color-heading)]"
          >
            {LogoMark}
          </Link>
          <nav
            className="ml-8 hidden items-center gap-6 md:flex"
            aria-label="Primary"
          >
            {visibleLinks.map((item) => (
              <SafeLink
                key={item.id ?? item.href}
                href={item.href}
                className="anvl-micro focus-ring text-xs no-underline hover:text-[var(--color-heading)]"
              >
                {item.label}
              </SafeLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {showCart ? (
              <Link
                to="/cart"
                className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]"
              >
                <ShoppingBag size={16} />
                <span className="absolute -right-1 -top-1 rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] text-[var(--color-bg)]">
                  {quantity}
                </span>
              </Link>
            ) : null}
            <IconButton
              className="md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open mobile navigation"
            >
              <Menu size={16} />
            </IconButton>
          </div>
        </Container>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <div className="flex items-center justify-between">
          {LogoMark}
          <IconButton
            onClick={() => setOpen(false)}
            aria-label="Close mobile navigation"
          >
            <X size={16} />
          </IconButton>
        </div>
        <nav className="mt-8 flex flex-col gap-4" aria-label="Mobile">
          {drawerLinks.map((item) => (
            <SafeLink
              key={`${item.id ?? item.href}-drawer`}
              href={item.href}
              className="anvl-heading focus-ring text-3xl no-underline"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </SafeLink>
          ))}
        </nav>
      </Drawer>
    </header>
  )
}
