import { cn } from '@/shared/lib/cn'
import { isSvgEmblemUrl, themeSvgMarkupForTint } from '@/shared/lib/themeSvgMarkup'

export { themeSvgMarkupForTint, isSvgEmblemUrl }

export type ThemeTintedMediaMarkProps = {
  src: string
  /** Pre-themed inline SVG — renders colored on first paint (from SSR loader). */
  themedSvgMarkup?: string | null
  className?: string
  width?: number
  height?: number
  /** Tint for SVG marks via `currentColor`. */
  tint?: string
  /** Soft glow using theme ember/accent. */
  glow?: string
}

function MediaMarkImage({
  src,
  className,
  width,
  height,
  glow,
}: {
  src: string
  className?: string
  width: number
  height: number
  glow: string
}) {
  return (
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      decoding="async"
      className={cn('block h-full w-full object-contain opacity-95', className)}
      style={{
        filter: `drop-shadow(0 0 22px color-mix(in srgb, ${glow} 38%, transparent))`,
      }}
    />
  )
}

function InlineThemedSvgMark({
  markup,
  className,
  width,
  height,
  tint,
  glow,
}: {
  markup: string
  className?: string
  width: number
  height: number
  tint: string
  glow: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      style={{
        width,
        height,
        color: tint,
        filter: `drop-shadow(0 0 22px color-mix(in srgb, ${glow} 38%, transparent))`,
      }}
    >
      <span
        className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </span>
  )
}

/** Renders CMS marks tinted to the active theme via inline SVG or raster fallback. */
export function ThemeTintedMediaMark({
  src,
  themedSvgMarkup,
  className,
  width = 96,
  height = 96,
  tint = 'var(--color-heading)',
  glow = 'var(--color-highlight)',
}: ThemeTintedMediaMarkProps) {
  const trimmed = src.trim()
  if (!trimmed) return null

  if (themedSvgMarkup && isSvgEmblemUrl(trimmed)) {
    return (
      <InlineThemedSvgMark
        markup={themedSvgMarkup}
        className={className}
        width={width}
        height={height}
        tint={tint}
        glow={glow}
      />
    )
  }

  if (!isSvgEmblemUrl(trimmed)) {
    return (
      <span
        className={cn('inline-flex shrink-0', className)}
        style={{ width, height }}
      >
        <MediaMarkImage
          src={trimmed}
          width={width}
          height={height}
          glow={glow}
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0', className)}
      style={{ width, height }}
    >
      <MediaMarkImage src={trimmed} width={width} height={height} glow={glow} />
    </span>
  )
}
