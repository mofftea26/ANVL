import { useMemo, useState } from 'react'
import type { LandingNavigationContent } from '@/features/cms/navigation/navigation.types'
import { AnnouncementRail } from '@/shared/components/layout/AnnouncementRail'
import { PremiumNavMobile } from '@/shared/components/layout/PremiumNavMobile'
import { PremiumNavTopbar } from '@/shared/components/layout/PremiumNavTopbar'
import { usePremiumNavPhase } from '@/shared/components/layout/usePremiumNavPhase'

export function PremiumNav({
  navigation,
}: {
  navigation: LandingNavigationContent
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { topbarVariant } = usePremiumNavPhase()

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
          Page content is offset by `<main>` padding on non-home routes; the home
          hero is intentionally full-bleed behind it. */}
      <header
        className="fixed top-0 left-0 right-0 z-40 w-full bg-transparent"
        data-premium-nav-position="overlay"
      >
        <AnnouncementRail
          announcement={navigation.announcement}
          variant={topbarVariant}
        />
        <PremiumNavTopbar
          variant={topbarVariant}
          logoSrc={logoSrc}
          visibleLinks={visibleLinks}
          showCart={showCart}
        />
      </header>

      <PremiumNavMobile
        logoSrc={logoSrc}
        drawerLinks={drawerLinks}
        showCart={showCart}
        open={mobileOpen}
        onOpen={() => setMobileOpen(true)}
        onClose={() => setMobileOpen(false)}
      />
    </>
  )
}
