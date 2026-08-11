import type Lenis from 'lenis'

/**
 * Module singleton exposing the live Lenis instance — the same
 * mutable-singleton pattern as `siteDustState`. `useLenisScroll` registers the
 * instance it creates and clears it on teardown; anything that needs an eased
 * programmatic scroll (the About altar's strike → chapter scroll-to) reads it
 * here.
 *
 * Why not `window.scrollTo` / `scrollIntoView`: Lenis owns the scroll position
 * while active (`ScrollTrigger.scrollerProxy` routes through it), so a native
 * smooth scroll fights its internal target and stutters or snaps back.
 * Callers must still handle `null` (Lenis gates off below 768px and under
 * reduced motion) with a native fallback.
 */
let activeLenis: Lenis | null = null

export function setActiveLenis(lenis: Lenis | null): void {
  activeLenis = lenis
}

export function getActiveLenis(): Lenis | null {
  return activeLenis
}
