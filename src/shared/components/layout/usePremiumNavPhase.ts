import { useEffect, useState } from 'react'

export type PremiumNavTopbarVariant = 'transparent' | 'solid'

export type PremiumNavPhase = {
  topbarVariant: PremiumNavTopbarVariant
}

/** Scroll distance (px) before the header turns solid. */
const SOLID_AFTER = 48

/**
 * The storefront header floats **transparent over the first/hero section** while
 * the page is at the top, then turns solid (blurred forge panel) once scrolled.
 * SSR + first client render are 'transparent' (page loads at the top), so there
 * is no hydration mismatch; a passive scroll listener flips it after mount.
 */
export function usePremiumNavPhase(): PremiumNavPhase {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > SOLID_AFTER)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { topbarVariant: solid ? 'solid' : 'transparent' }
}
