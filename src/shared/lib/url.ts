/**
 * URL helpers used at every boundary where a CMS-driven (or otherwise
 * untrusted) URL is rendered into the DOM.
 *
 * Rule of thumb (codified in .cursor/rules/10-security.mdc): every
 * CMS-driven `href` / `<Link to>` must funnel through {@link sanitizeHref}
 * before reaching the DOM. Returning `null` means the input failed the
 * allowlist — callers should either skip rendering the link or render the
 * label as plain text.
 *
 * Audit refs: Phase B3 / SEC-04.
 */

export type SanitizedScheme = 'https' | 'http' | 'mailto' | 'tel'

export type SanitizeHrefOptions = {
  /** Allow relative URLs (start with `/`, `#`, `?`). Default true. */
  allowRelative?: boolean
  /** Allowed URL schemes for absolute URLs. Default `['https','http','mailto','tel']`. */
  schemes?: ReadonlyArray<SanitizedScheme>
}

const DEFAULT_SCHEMES: ReadonlyArray<SanitizedScheme> = [
  'https',
  'http',
  'mailto',
  'tel',
]

const SCHEME_PATTERN = /^([a-z][a-z0-9+\-.]*):/i

/**
 * Returns a sanitized href that's safe to pass to `<a href>` or
 * TanStack Router `<Link to>`. Returns `null` for any input that
 * fails the allowlist.
 *
 * The check is conservative — when in doubt it rejects:
 * - Non-string input.
 * - Strings containing control characters (incl. `\n`, `\r`, `\t`).
 * - URLs with a scheme not on the allowlist (`javascript:`, `data:`,
 *   `vbscript:`, `file:`, `ssh:`, etc.).
 * - Relative URLs when `allowRelative: false`.
 */
export function sanitizeHref(
  raw: unknown,
  options?: SanitizeHrefOptions,
): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Reject control characters (incl. embedded \n that some browsers tolerate).
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return null

  const allowRelative = options?.allowRelative !== false
  const schemes = options?.schemes ?? DEFAULT_SCHEMES

  if (isRelative(trimmed)) {
    return allowRelative ? trimmed : null
  }

  const schemeMatch = SCHEME_PATTERN.exec(trimmed)
  if (!schemeMatch) {
    // Scheme-less but not relative — treat as ambiguous and reject so
    // browsers don't fall back to surprising behavior.
    return null
  }
  const scheme = schemeMatch[1]!.toLowerCase() as SanitizedScheme
  if (!(schemes as ReadonlyArray<string>).includes(scheme)) return null

  return trimmed
}

/** True for `/path`, `#hash`, `?query`. */
function isRelative(value: string): boolean {
  return value.startsWith('/') || value.startsWith('#') || value.startsWith('?')
}

/**
 * Normalizes a human-entered link URL into a form {@link sanitizeHref} accepts.
 * Empty stays empty; relative paths (`/`, `#`, `?`) and already-schemed URLs
 * pass through unchanged; a scheme-less value like `shop.com/sale` gets
 * `https://` prepended — the common case where someone omits the protocol,
 * which `sanitizeHref` otherwise rejects as ambiguous (so the link silently
 * never renders). The result STILL must pass `sanitizeHref` before hitting the
 * DOM — this only rescues the frequent "forgot https://" input; it is not
 * itself a security boundary.
 */
export function normalizeLinkHref(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (isRelative(trimmed)) return trimmed
  if (SCHEME_PATTERN.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Returns true when {@link sanitizeHref}-shaped input is an absolute URL
 * (http(s)/mailto/tel) rather than a relative path. Use this to decide
 * between `<a href>` (external) and TanStack `<Link to>` (internal) at
 * render time.
 */
export function isExternalHref(href: string): boolean {
  return SCHEME_PATTERN.test(href)
}

/**
 * Normalizes an absolute image URL to HTTPS. Returns the input unchanged
 * for relative paths, mailto/tel, or anything sanitizeHref would already
 * reject. Use at the SEO / JSON-LD / OG boundary so mixed-content `http://`
 * images don't bleed into canonical surfaces.
 *
 * Audit refs: Phase B7 / SEC-15.
 */
export function upgradeHttpToHttps(href: string): string {
  if (href.startsWith('http://')) return 'https://' + href.slice('http://'.length)
  return href
}

/**
 * Allowlist for values rendered into `<img src>` / `<video src>` / `<source>`
 * elements: https/http, `/public` paths, and `data:image/*` or `data:video/*`
 * URIs (typical FileReader output).
 *
 * Rejects: `javascript:`, `data:text/html`, `vbscript:`, `file:`, scheme-less
 * ambiguous strings, control chars, and the empty string.
 *
 * Audit refs: Phase B4 / SEC-20.
 */
const SHOPIFY_CDN_HOST_RE = /(^|\.)cdn\.shopify\.com$/i

/**
 * Requests a smaller Shopify CDN rendition via their documented `width` query
 * param — resizing is always available on Shopify's CDN (no plan/feature
 * gating, unlike Supabase Storage's image-transform add-on). No-ops for any
 * URL not served from Shopify's CDN, so it's safe to call on every product
 * image regardless of commerce backend (seed/local adapters return local or
 * Supabase paths, which pass through unchanged).
 *
 * Audit refs: PERF-24 (product card/gallery images requested at full
 * upstream resolution and downscaled with CSS instead of via the CDN).
 */
export function withShopifyImageWidth(src: string, width: number): string {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return src
  }
  if (!SHOPIFY_CDN_HOST_RE.test(url.hostname)) return src
  url.searchParams.set('width', String(Math.round(width)))
  return url.toString()
}

export function isLikelySafeMediaSrc(raw: unknown): boolean {
  if (typeof raw !== 'string') return false
  const t = raw.trim()
  if (!t) return false
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(t)) return false
  // Relative public path or query/hash — accepted (in-app routing usually).
  if (t.startsWith('/') || t.startsWith('#') || t.startsWith('?')) return true
  // data:image/...,foo or data:video/...,foo  (NOT data:text/html or data:application/*).
  if (/^data:(?:image|video)\/[\w.+-]+[;,]/i.test(t)) return true
  // Absolute http(s) URLs only.
  return /^https?:\/\//i.test(t)
}
