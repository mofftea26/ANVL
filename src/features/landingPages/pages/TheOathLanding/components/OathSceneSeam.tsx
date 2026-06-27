import { cn } from '@/shared/lib/cn'

/** Longer, lower-contrast feather for mobile/tablet boundaries (no visible split line). */
const SUBTLE_TOP_GRADIENT =
  'linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 92%, transparent) 0%, color-mix(in srgb, var(--color-bg) 76%, transparent) 14%, color-mix(in srgb, var(--color-bg) 56%, transparent) 30%, color-mix(in srgb, var(--color-bg) 36%, transparent) 48%, color-mix(in srgb, var(--color-bg) 18%, transparent) 68%, color-mix(in srgb, var(--color-bg) 6%, transparent) 86%, transparent 100%)'

const SUBTLE_BOTTOM_GRADIENT =
  'linear-gradient(to top, color-mix(in srgb, var(--color-bg) 92%, transparent) 0%, color-mix(in srgb, var(--color-bg) 76%, transparent) 14%, color-mix(in srgb, var(--color-bg) 56%, transparent) 30%, color-mix(in srgb, var(--color-bg) 36%, transparent) 48%, color-mix(in srgb, var(--color-bg) 18%, transparent) 68%, color-mix(in srgb, var(--color-bg) 6%, transparent) 86%, transparent 100%)'

/** Standard desktop cinematic dissolve — long, eased multi-stop feather into the void. */
const DEFAULT_TOP_GRADIENT =
  'linear-gradient(to bottom, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 92%, transparent) 12%, color-mix(in srgb, var(--color-bg) 78%, transparent) 24%, color-mix(in srgb, var(--color-bg) 58%, transparent) 38%, color-mix(in srgb, var(--color-bg) 38%, transparent) 54%, color-mix(in srgb, var(--color-bg) 20%, transparent) 70%, color-mix(in srgb, var(--color-bg) 7%, transparent) 86%, transparent 100%)'

const DEFAULT_BOTTOM_GRADIENT =
  'linear-gradient(to top, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 92%, transparent) 12%, color-mix(in srgb, var(--color-bg) 78%, transparent) 24%, color-mix(in srgb, var(--color-bg) 58%, transparent) 38%, color-mix(in srgb, var(--color-bg) 38%, transparent) 54%, color-mix(in srgb, var(--color-bg) 20%, transparent) 70%, color-mix(in srgb, var(--color-bg) 7%, transparent) 86%, transparent 100%)'

/**
 * Opaque section hand-off — solid `--color-bg` at the outer edge with a longer,
 * denser inner feather. Pairs on adjacent sections (manifesto↔tenets) so the
 * dissolve never reads as a transparent void over the WebGL backdrop.
 */
const OPAQUE_TOP_GRADIENT =
  'linear-gradient(to bottom, var(--color-bg) 0%, var(--color-bg) 8%, color-mix(in srgb, var(--color-bg) 97%, transparent) 20%, color-mix(in srgb, var(--color-bg) 82%, transparent) 40%, color-mix(in srgb, var(--color-bg) 58%, transparent) 58%, color-mix(in srgb, var(--color-bg) 32%, transparent) 76%, transparent 100%)'

const OPAQUE_BOTTOM_GRADIENT =
  'linear-gradient(to top, var(--color-bg) 0%, var(--color-bg) 8%, color-mix(in srgb, var(--color-bg) 97%, transparent) 20%, color-mix(in srgb, var(--color-bg) 82%, transparent) 40%, color-mix(in srgb, var(--color-bg) 58%, transparent) 58%, color-mix(in srgb, var(--color-bg) 32%, transparent) 76%, transparent 100%)'

/**
 * Soft shadow seams so adjacent scenes **dissolve into the themed void** instead
 * of meeting at a hard edge. Pure decorative overlay (`pointer-events-none`,
 * `aria-hidden`) that feathers the section's top and/or bottom into `--color-bg`.
 * Theme-driven (no token edits) and sits below the scene copy (`z-10`) but above
 * the scene media, so it shadows the seams without dimming the text. Static —
 * no layout animation, transform/opacity-friendly.
 *
 * `tone="opaque"` — dense `--color-bg` feather for adjacent opaque sections
 * (manifesto↔tenets); never reveals the WebGL void through the hand-off band.
 *
 * `tone="blend"` — no opaque `--color-bg` paint; marks the edge for pairing with
 * section-level alpha masks so adjacent scenes fade to transparent over the void.
 */
export function OathSceneSeam({
  edges = 'both',
  tone = 'default',
  className,
}: {
  edges?: 'top' | 'bottom' | 'both'
  /** `subtle` — longer, lower-contrast feather for mobile/tablet hand-offs. */
  tone?: 'default' | 'subtle' | 'blend' | 'opaque'
  className?: string
}) {
  const showTop = edges === 'top' || edges === 'both'
  const showBottom = edges === 'bottom' || edges === 'both'
  const isSubtle = tone === 'subtle'
  const isBlend = tone === 'blend'
  const isOpaque = tone === 'opaque'
  const heightClass = isSubtle
    ? 'h-52 md:h-64 xl:h-48'
    : isBlend
      ? 'h-48 xl:h-64'
      : isOpaque
        ? 'h-40 md:h-48 xl:h-64'
        : 'h-40 md:h-52 xl:h-64'
  const topGradient = isBlend
    ? undefined
    : isOpaque
      ? OPAQUE_TOP_GRADIENT
      : isSubtle
        ? SUBTLE_TOP_GRADIENT
        : DEFAULT_TOP_GRADIENT
  const bottomGradient = isBlend
    ? undefined
    : isOpaque
      ? OPAQUE_BOTTOM_GRADIENT
      : isSubtle
        ? SUBTLE_BOTTOM_GRADIENT
        : DEFAULT_BOTTOM_GRADIENT

  return (
    <>
      {showTop ? (
        <div
          aria-hidden="true"
          data-scene-seam="top"
          data-scene-seam-tone={tone}
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-[2]',
            heightClass,
            className,
          )}
          style={topGradient ? { background: topGradient } : undefined}
        />
      ) : null}
      {showBottom ? (
        <div
          aria-hidden="true"
          data-scene-seam="bottom"
          data-scene-seam-tone={tone}
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-[2]',
            heightClass,
            className,
          )}
          style={bottomGradient ? { background: bottomGradient } : undefined}
        />
      ) : null}
    </>
  )
}

/** Section-level alpha mask — products bottom fades to transparent on xl+ (pairs
 * with blend seam). The fade is kept to the bottom edge only so the "view the
 * drop" CTA above it stays fully opaque (not faded). */
export const OATH_PRODUCTS_FINALE_BLEND_MASK =
  'xl:[mask-image:linear-gradient(to_bottom,black_0%,black_90%,rgba(0,0,0,0.55)_96%,transparent_100%)] xl:[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_90%,rgba(0,0,0,0.55)_96%,transparent_100%)]'

/** Section-level alpha mask — finale top fades in from transparent on xl+ (pairs with blend seam). */
export const OATH_FINALE_PRODUCTS_BLEND_MASK =
  'xl:[mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_7%,black_14%,black_100%)] xl:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_7%,black_14%,black_100%)]'
