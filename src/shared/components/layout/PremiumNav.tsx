import { useMemo, useState } from 'react'
import type { LandingNavigationContent } from '@/features/cms/navigation/navigation.types'
import { AnnouncementRail } from '@/shared/components/layout/AnnouncementRail'
import { PremiumNavMobile } from '@/shared/components/layout/PremiumNavMobile'
import { PremiumNavTopbar } from '@/shared/components/layout/PremiumNavTopbar'

export function PremiumNav({
  navigation,
  alwaysTransparent = false,
}: {
  navigation: LandingNavigationContent
  /**
   * Landing page only: keep the header fully transparent at all scroll positions
   * (no scrim), so it reads as part of the cinematic page. Every other route
   * instead gets a permanent dark scrim that fades to transparent at its bottom
   * edge, so the nav is always legible without a hard solid bar.
   */
  alwaysTransparent?: boolean
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  // Content/icons always use the light "transparent" styling — on the landing
  // they sit over the hero, elsewhere over the dark scrim below.
  const variant = 'transparent' as const
  const scrim: 'none' | 'always' = alwaysTransparent ? 'none' : 'always'

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
          scrim={scrim}
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
