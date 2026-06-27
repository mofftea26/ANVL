/**
 * Class names for the storefront `<main>` shell in `__root.tsx`.
 * Home landing pages are full-bleed under the fixed header; other routes reserve
 * space with `--anvl-header-h` padding.
 */
export function getStorefrontMainClassName(options: {
  showChrome: boolean
  isHome: boolean
}): string | undefined {
  const { showChrome, isHome } = options
  if (!showChrome) {
    return 'fixed inset-0 z-0 h-[100dvh] overflow-hidden overscroll-none'
  }
  if (isHome) {
    return undefined
  }
  return 'pt-[var(--anvl-header-h)]'
}
