import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'

/** Map a storefront pathname to its asset page key (null = no backdrop —
 *  home and the About cinematic paint their own full-bleed backdrops). */
export function pageKeyFromPathname(pathname: string): string | null {
  if (pathname === '/') return null
  if (pathname === '/about') return null
  if (pathname.startsWith('/shop/')) return 'pdp'
  if (pathname === '/shop') return 'shop'
  if (pathname.startsWith('/account')) return 'account'
  if (pathname.startsWith('/auth')) return 'auth'
  if (pathname === '/story') return 'story'
  if (pathname === '/cart') return 'cart'
  if (pathname.startsWith('/checkout')) return 'checkout'
  if (pathname === '/contact') return 'contact'
  if (pathname === '/size-guide') return 'size-guide'
  if (pathname === '/care-guide') return 'care-guide'
  return null
}

/** Pages that ship a bundled default backdrop in /public/page-backgrounds. */
const BUNDLED_DEFAULTS = new Set(['shop', 'story', 'account', 'auth'])

/**
 * Resolve the page backdrop src for a pathname: a CMS-assigned `pageBackground`
 * asset wins; otherwise the bundled default for pages that have one; else null.
 */
export function resolvePageBackdropSrc(
  pathname: string,
  assets: AssetConfig,
  mediaIndex: MediaIndexEntry[],
): string | null {
  const key = pageKeyFromPathname(pathname)
  if (!key) return null
  const resolved = resolveStorefrontPageAssets(assets, key, mediaIndex)
  if (resolved.pageBackground) return resolved.pageBackground
  return BUNDLED_DEFAULTS.has(key) ? `/page-backgrounds/${key}-background.webp` : null
}
