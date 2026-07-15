/**
 * Class names for the storefront `<main>` shell in `__root.tsx`.
 * Full-bleed routes (home landing, the About cinematic) run edge-to-edge under
 * the fixed transparent header; other routes reserve space with
 * `--anvl-header-h` padding.
 */

/** Routes that render full-bleed under a transparent header (no main padding,
 *  no PageBackdrop — the page paints its own fixed backdrops). */
export const FULL_BLEED_STOREFRONT_PATHS: ReadonlySet<string> = new Set(['/', '/about'])

/** Full-bleed path prefixes (dynamic routes the exact-match Set can't cover).
 *  `/p/<token>` — the passport paints its own atmosphere edge-to-edge, so the
 *  transparent bar sits ON the page instead of over a seam. */
const FULL_BLEED_STOREFRONT_PREFIXES = ['/p/'] as const

export function isFullBleedStorefrontPath(pathname: string): boolean {
  return (
    FULL_BLEED_STOREFRONT_PATHS.has(pathname) ||
    FULL_BLEED_STOREFRONT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
}

export function getStorefrontMainClassName(options: {
  showChrome: boolean
  isFullBleed: boolean
}): string | undefined {
  const { showChrome, isFullBleed } = options
  if (!showChrome) {
    return 'fixed inset-0 z-0 h-[100dvh] overflow-hidden overscroll-none'
  }
  if (isFullBleed) {
    return undefined
  }
  return 'pt-[var(--anvl-header-h)]'
}
