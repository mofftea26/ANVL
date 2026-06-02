import { useMemo, useState } from 'react'
import type { LandingNavigationContent } from '@/features/cms/landing/landingPageCms.types'
import { AnnouncementRail } from '@/shared/components/layout/AnnouncementRail'
import { PremiumNavMobile } from '@/shared/components/layout/PremiumNavMobile'
import { PremiumNavSideRail } from '@/shared/components/layout/PremiumNavSideRail'
import { PremiumNavTopbar } from '@/shared/components/layout/PremiumNavTopbar'
import { usePremiumNavPhase } from '@/shared/components/layout/usePremiumNavPhase'
import { cn } from '@/shared/lib/cn'

export function PremiumNav({
  navigation,
}: {
  navigation: LandingNavigationContent
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { topbarVariant, showSideRail, sections, activeSectionId } =
    usePremiumNavPhase()

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

  const isOverlay = topbarVariant === 'transparent'

  return (
    <>
      <header
        className={cn(
          'z-40 w-full',
          isOverlay
            ? 'fixed top-0 left-0 right-0 bg-transparent'
            : 'sticky top-0',
        )}
        data-premium-nav-position={isOverlay ? 'overlay' : 'flow'}
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

      {showSideRail ? (
        <PremiumNavSideRail
          sections={sections}
          activeSectionId={activeSectionId}
        />
      ) : null}

      <PremiumNavMobile
        logoSrc={logoSrc}
        drawerLinks={drawerLinks}
        showCart={showCart}
        open={mobileOpen}
        onOpen={() => setMobileOpen(true)}
        onClose={() => setMobileOpen(false)}
      />

      {/* Spacer only when header is in document flow (commerce). Overlay cinematic nav must not push hero. */}
      {!isOverlay ? (
        <div
          className="pointer-events-none h-[calc(56px+env(safe-area-inset-bottom,0px))] md:hidden"
          aria-hidden="true"
        />
      ) : null}
    </>
  )
}
