/**
 * Path + preview rules for the Coming Soon site-mode gate (consumed by
 * `src/routes/__root.tsx`).
 *
 * When `coming_soon.enabled` is on, every public route renders the reveal
 * page — no redirects, HTTP 200 everywhere, so deep links resolve and turning
 * the flag off instantly restores every route. `/admin` is exempt so the CMS
 * is always reachable; `/p` (product passports) is exempt because the QR cards
 * ship with physical products — a customer holding one must always reach their
 * passport; `/armory` (shared public armories) is exempt so a link an owner
 * shared keeps resolving; and `/auth` is exempt so the passport claim's sign-in
 * step works.
 */

/** Route prefixes that are never gated. */
export const COMING_SOON_EXEMPT_PREFIXES = ['/admin', '/p', '/armory', '/auth'] as const

export function isComingSoonExemptPath(pathname: string): boolean {
  return COMING_SOON_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/**
 * Admin preview bypass — convenience, NOT access control (the reveal page is
 * marketing, not security). Visiting any public URL with `?anvl-preview=live`
 * arms a sessionStorage flag so that browser tab shows the real site while
 * Coming Soon stays public; `?anvl-preview=off` (or closing the tab) clears it.
 */
export const COMING_SOON_PREVIEW_PARAM = 'anvl-preview'
export const COMING_SOON_PREVIEW_STORAGE_KEY = 'anvl.comingSoonPreview.v1'

/** Reads (and, when the query param is present, updates) the bypass flag. */
export function readComingSoonPreviewBypass(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const param = new URLSearchParams(window.location.search).get(
      COMING_SOON_PREVIEW_PARAM,
    )
    if (param === 'live') {
      window.sessionStorage.setItem(COMING_SOON_PREVIEW_STORAGE_KEY, '1')
      return true
    }
    if (param === 'off') {
      window.sessionStorage.removeItem(COMING_SOON_PREVIEW_STORAGE_KEY)
      return false
    }
    return window.sessionStorage.getItem(COMING_SOON_PREVIEW_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
