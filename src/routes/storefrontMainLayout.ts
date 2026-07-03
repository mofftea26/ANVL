/**
 * Class names for the storefront `<main>` shell in `__root.tsx`.
 * Full-bleed routes (home landing, the About cinematic) run edge-to-edge under
 * the fixed transparent header; other routes reserve space with
 * `--anvl-header-h` padding.
 */

/** Routes that render full-bleed under a transparent header (no main padding,
 *  no PageBackdrop — the page paints its own fixed backdrops). */
export const FULL_BLEED_STOREFRONT_PATHS: ReadonlySet<string> = new Set(['/', '/about'])

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
