import { useMemo, useState } from 'react'
import type { LandingNavigationContent } from '@/features/cms/navigation/navigation.types'
import { AnnouncementRail } from '@/shared/components/layout/AnnouncementRail'
import { PremiumNavMobile } from '@/shared/components/layout/PremiumNavMobile'
import { PremiumNavTopbar } from '@/shared/components/layout/PremiumNavTopbar'
import { usePremiumNavPhase } from '@/shared/components/layout/usePremiumNavPhase'

export function PremiumNav({
  navigation,
  alwaysTransparent = false,
}: {
  navigation: LandingNavigationContent
  /**
   * Keep the header transparent at all scroll positions (no solid scrim bar), so
   * it reads as part of the page rather than a separate panel. Used on the
   * landing page, where the fixed hero header scrim keeps the nav legible over
   * every section.
   */
  alwaysTransparent?: boolean
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { topbarVariant } = usePremiumNavPhase()
  const variant = alwaysTransparent ? 'transparent' : topbarVariant

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
  const logoSrc = navigation.headerLogoSrc

  return (
    <>
      {/* Always a fixed overlay: transparent over the hero, solid on scroll.
          Non-home routes offset `<main>` with header padding; the home landing
          is full-bleed under the bar (sections use `--anvl-section-h`). */}
      <header
        className="fixed top-0 left-0 right-0 z-40 w-full bg-transparent"
        data-premium-nav-position="overlay"
      >
        <AnnouncementRail
          announcement={navigation.announcement}
          variant={variant}
        />
        <PremiumNavTopbar
          variant={variant}
          logoSrc={logoSrc}
          visibleLinks={visibleLinks}
          showCart={showCart}
          onMenuOpen={() => setMobileOpen(true)}
        />
      </header>

      <PremiumNavMobile
        logoSrc={logoSrc}
        drawerLinks={drawerLinks}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  )
}
