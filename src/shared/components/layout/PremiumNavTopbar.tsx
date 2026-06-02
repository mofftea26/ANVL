import { Link } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CmsLinkItem } from '@/features/cms/landing/landingPageCms.types'
import { useCart } from '@/features/cart/hooks/useCart'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { cn } from '@/shared/lib/cn'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import type { PremiumNavTopbarVariant } from '@/shared/components/layout/usePremiumNavPhase'

export function PremiumNavTopbar({
  variant,
  logoSrc,
  visibleLinks,
  showCart,
}: {
  variant: PremiumNavTopbarVariant
  logoSrc?: string
  visibleLinks: CmsLinkItem[]
  showCart: boolean
}) {
  const { quantity } = useCart()
  const isSolid = variant === 'solid'

  const LogoMark: ReactNode = logoSrc?.trim() ? (
    <img
      src={logoSrc.trim()}
      alt="ANVL"
      className={cn(
        'h-11 w-auto max-w-[200px] object-contain md:h-12',
        !isSolid && 'brightness-0 invert opacity-95',
      )}
      fetchPriority="high"
    />
  ) : (
    <AnvlLogoImage
      variant="stacked"
      className="h-11 w-auto text-[var(--color-heading)] md:h-12"
      fetchPriority="high"
    />
  )

  return (
    <div
      className={cn(
        'border-b transition-[background-color,border-color,backdrop-filter] duration-300',
        isSolid
          ? 'border-[var(--color-line)] bg-[rgba(11,11,12,0.92)] backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
      data-premium-topbar
      data-premium-topbar-variant={variant}
    >
      <Container className="flex h-14 items-center gap-3 md:h-16">
        <Link
          to="/"
          className="focus-ring inline-flex shrink-0 items-center text-[var(--color-heading)]"
        >
          {LogoMark}
        </Link>
        <nav
          className="ml-6 hidden items-center gap-6 md:flex"
          aria-label="Primary"
        >
          {visibleLinks.map((item) => (
            <SafeLink
              key={item.id ?? item.href}
              href={item.href}
              className={cn(
                'anvl-micro focus-ring text-xs no-underline transition-colors',
                isSolid
                  ? 'text-[var(--color-text-muted)] hover:text-[var(--color-heading)]'
                  : 'text-[var(--color-heading)]/75 hover:text-[var(--color-heading)]',
              )}
            >
              {stripAngleBracketTags(item.label)}
            </SafeLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {showCart ? (
            <Link
              to="/cart"
              className={cn(
                'focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-md border backdrop-blur-sm transition-colors',
                isSolid
                  ? 'border-[var(--color-line)] bg-[var(--color-surface)]/80'
                  : 'border-white/15 bg-white/5 hover:bg-white/10',
              )}
              aria-label={`Cart, ${quantity} items`}
            >
              <ShoppingBag size={16} aria-hidden="true" />
              <span className="absolute -right-1 -top-1 min-w-[1.125rem] rounded-full bg-[var(--color-accent)] px-1.5 text-center text-[10px] font-medium text-[var(--color-bg)]">
                {quantity}
              </span>
            </Link>
          ) : null}
        </div>
      </Container>
    </div>
  )
}
