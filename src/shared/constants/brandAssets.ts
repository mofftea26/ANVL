/** Last-resort emblem when CMS `emblemFallback` / asset slots are unset. */
export const DEFAULT_EMBLEM_SRC = '/brand/the-oath-shape.svg'

/**
 * Bundled stand-in artwork (the Drop 01 / Oath emblem + generic product plate)
 * shipped in `public/brand`. These are NOT real product photos — seed/mock
 * products point at them — so the storefront should treat them as "no image"
 * and fall through to a CMS-assigned placeholder before showing the emblem as
 * the final fallback.
 */
export const BUNDLED_PLACEHOLDER_SRCS = [
  '/brand/the-oath-shape.svg',
  '/brand/placeholder-product.svg',
] as const

/** True when `src` is one of the bundled placeholders (not a real product image). */
export function isBundledPlaceholderImage(src: string | undefined | null): boolean {
  if (!src) return true
  const trimmed = src.trim()
  if (!trimmed) return true
  return BUNDLED_PLACEHOLDER_SRCS.some((p) => trimmed.endsWith(p))
}
