import { Link } from '@tanstack/react-router'
import { Menu, ShoppingBag } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CmsLinkItem } from '@/features/cms/navigation/navigation.types'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartDrawerStore } from '@/features/cart/store/cartDrawer.store'
import { AccountMenu } from '@/features/storefront-account/account/AccountMenu'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { cn } from '@/shared/lib/cn'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import type { PremiumNavTopbarVariant } from '@/shared/components/layout/usePremiumNavPhase'

export function PremiumNavTopbar({
  variant,
  scrim = 'none',
  logoSrc,
  visibleLinks,
  showCart,
  onMenuOpen,
}: {
  variant: PremiumNavTopbarVariant
  /**
   * `none` — fully transparent (landing, over the hero). `always` — a permanent
   * dark gradient that fades to transparent at the bottom edge (every other
   * route), so the bar is legible without a hard solid panel.
   */
  scrim?: 'none' | 'always'
  logoSrc?: string
  visibleLinks: CmsLinkItem[]
  showCart: boolean
  /** Opens the mobile/tablet navigation drawer (burger trigger lives here now). */
  onMenuOpen: () => void
}) {
  const { quantity } = useCart()
  const openCart = useCartDrawerStore((s) => s.openDrawer)
  const isSolid = variant === 'solid'

  // Shared variant-aware chrome for the right-side icon controls so the cart and
  // burger read cleanly over both the transparent hero and the solid bar.
  const iconChrome = cn(
    'focus-ring relative inline-flex h-9 w-9 items-center justify-center rounded-md border backdrop-blur-sm transition-colors sm:h-11 sm:w-11',
    isSolid
      ? 'border-[var(--color-line)] bg-[var(--color-surface)]/80 text-[var(--color-text)]'
      : 'border-white/15 bg-white/5 text-[var(--color-heading)] hover:bg-white/10',
  )
  // Cart + account avatar are round (per brand chrome); burger stays square.
  const iconChromeRound = cn(iconChrome, 'rounded-full')

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
      variant="wordmark"
      className="h-5 w-auto text-[var(--color-heading)] sm:h-6 md:h-7"
      fetchPriority="high"
    />
  )

  return (
    <div
      className="relative"
      data-premium-topbar
      data-premium-topbar-variant={variant}
    >
      {/* Scrim on its own layer so the fade never touches the bar's content
          (logo/links/icons live in the sibling Container above it). On non-landing
          routes (`scrim='always'`) it is a permanent dark band — solid at the top
          (the bar) feathering to transparent at the bottom, so the page content
          scrolls cleanly under the fade with no hard edge. The landing page passes
          `scrim='none'` to stay fully transparent over the hero. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -bottom-5 left-0 right-0 top-0 transition-opacity duration-300',
          scrim === 'always' ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'linear-gradient(to bottom, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 72%, transparent) 45%, color-mix(in srgb, var(--color-bg) 28%, transparent) 75%, transparent 100%)',
        }}
      />
      <Container className="relative flex h-14 items-center gap-3 md:h-16">
        <Link
          to="/"
          className="focus-ring inline-flex shrink-0 items-center text-[var(--color-heading)]"
        >
          {LogoMark}
        </Link>
        <nav
          className="ml-6 hidden items-center gap-6 lg:flex"
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
        <div className="ml-auto flex items-center gap-2">
          {showCart ? (
            <button
              type="button"
              onClick={openCart}
              className={iconChromeRound}
              aria-label={`Open cart, ${quantity} ${quantity === 1 ? 'item' : 'items'}`}
            >
              <ShoppingBag size={16} aria-hidden="true" />
              {quantity > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[1.125rem] rounded-full bg-[var(--color-accent)] px-1.5 text-center text-[10px] font-medium text-[var(--color-bg)]">
                  {quantity}
                </span>
              ) : null}
            </button>
          ) : null}

          {/* Burger — opens the nav drawer on mobile + tablet. Hidden at lg. */}
          <button
            type="button"
            onClick={onMenuOpen}
            className={cn(iconChrome, 'lg:hidden')}
            aria-label="Open navigation menu"
          >
            <Menu size={16} aria-hidden="true" />
          </button>

          {/* Account — desktop only. Below `lg` the burger + cart are the only
              topbar controls; signed-in identity moves into the nav drawer's
              profile card (see AccountDrawerSection / PremiumNavMobile). */}
          <div className="hidden lg:block">
            <AccountMenu triggerClassName={iconChromeRound} />
          </div>
        </div>
      </Container>
    </div>
  )
}
