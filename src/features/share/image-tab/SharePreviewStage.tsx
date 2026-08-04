import { AlertTriangle, Anvil } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { ShareFormatKey } from '../types'
import { shareFormatMeta } from './presetMeta'
import { SharePhotoControls, type SharePhotoControl } from './SharePhotoControls'

/**
 * The lit plate the whole tab is built around.
 *
 * The stage is a FIXED box — one height, full content width, never resized by
 * anything. Only the image inside it changes shape. The old frame derived its
 * width from a per-format aspect class, so it jumped 180 → 256 → 320px as you
 * tapped through the formats and, at 1:1, computed wider than its own
 * container and got squeezed out of aspect by a flex shrink.
 *
 * The image is sized `max-h-full max-w-full` with auto width and height, which
 * is CSS's aspect-preserving "shrink to fit both constraints" for a replaced
 * element. Because the element box then equals the image bounds exactly, the
 * ring and shadow hug the artwork at every format instead of surrounding the
 * empty letterbox `object-contain` would leave behind.
 *
 * The centring layer is FLEX, not grid, and that is load-bearing: an auto-sized
 * grid row is not a definite height, so `max-h-full` against it resolves to
 * `none` and a 9:16 render overflows (and, under `overflow-hidden`, is silently
 * cropped). A flex item's percentage max-height resolves against the flex
 * container, whose height is definite here via `inset-3`. Measured, not assumed.
 *
 * The stage also HOSTS the photo control (`SharePhotoControls`), because the
 * preview is what a photo changes. The pick failure that control can produce is
 * rendered under the plate rather than on it: an alert painted over the artwork
 * would obscure the one thing the stage exists to show.
 *
 * ONE FIXED HEIGHT ON A PHONE, THE WHOLE COLUMN ON A DESKTOP. From `lg` the tab
 * hands the stage its own 26rem column and the plate grows to fill it
 * (`lg:flex-1`), which is the entire reason the dialog is widened: a 9:16 story
 * goes from ~170×300 to ~371×660 — near enough life-size to judge. `min-h-0` on
 * both the root and the plate is what lets that column shrink on a short
 * laptop instead of pushing the export bar out of the dialog.
 */
export function SharePreviewStage({
  dataUrl,
  format,
  pending,
  failed,
  photo,
}: {
  dataUrl: string | null
  format: ShareFormatKey
  pending: boolean
  failed: boolean
  photo: SharePhotoControl
}) {
  const reducedMotion = useReducedMotion()
  const meta = shareFormatMeta(format)

  return (
    <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div
        className={cn(
          'relative h-[clamp(200px,30svh,300px)] w-full overflow-hidden rounded-2xl',
          'bg-[color-mix(in_oklab,var(--color-bg)_82%,var(--color-surface))]',
          'ring-1 ring-inset ring-[var(--color-line)]',
          // `flex-basis:0` wins over the clamp for a column flex item, so the
          // plate takes exactly the height the column has left.
          'lg:h-auto lg:min-h-0 lg:flex-1',
        )}
      >
        {/* Forge heat from above, then the industrial tooth. Both decorative. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,var(--color-highlight-soft)_0%,transparent_62%)]"
        />
        <span aria-hidden="true" className="anvl-grid-overlay absolute inset-0 opacity-[0.35]" />

        <div className="absolute inset-3 flex items-center justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt=""
              aria-hidden="true"
              decoding="async"
              className={cn(
                'block max-h-full max-w-full rounded-lg',
                'shadow-[0_18px_46px_-16px_rgba(0,0,0,0.85)]',
                'motion-safe:transition-opacity motion-safe:duration-200',
                failed
                  ? 'ring-1 ring-[color-mix(in_oklab,var(--color-danger)_60%,transparent)]'
                  : 'ring-1 ring-[color-mix(in_oklab,var(--color-highlight)_38%,transparent)]',
                pending ? 'opacity-90' : 'opacity-100',
              )}
            />
          ) : (
            <div
              aria-hidden="true"
              className={cn(
                'grid h-full aspect-[9/16] place-items-center rounded-lg',
                'bg-[var(--color-surface-elevated)] ring-1 ring-inset ring-[var(--color-line)]',
                failed
                  ? 'ring-[color-mix(in_oklab,var(--color-danger)_60%,transparent)]'
                  : undefined,
              )}
            >
              <Anvil
                size={ICON_SIZE.xl}
                className="text-[color-mix(in_oklab,var(--color-highlight)_45%,transparent)]"
              />
            </div>
          )}
        </div>

        {/* Pending never blanks the frame — a copper pass sweeps over it instead,
            so the composition you are judging stays on screen. */}
        {pending && !reducedMotion ? (
          <span
            aria-hidden="true"
            className="anvl-progress-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,var(--color-highlight-soft),transparent)]"
          />
        ) : null}

        <SharePhotoControls photo={photo} />

        <span
          className={cn(
            'anvl-micro pointer-events-none absolute bottom-3 right-3 rounded-full px-2 py-1',
            'bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] text-[9px] backdrop-blur-sm',
            'text-[var(--color-text-muted)]',
          )}
        >
          {pending && reducedMotion ? 'Forging…' : `${meta.label} · ${meta.dimensions}`}
        </span>
      </div>

      {photo.error ? (
        <p
          role="alert"
          className="mt-2 flex shrink-0 items-start gap-1.5 text-[11px] text-[var(--color-danger)]"
        >
          <AlertTriangle size={ICON_SIZE.xs} aria-hidden="true" className="mt-px shrink-0" />
          {photo.error}
        </p>
      ) : null}
    </div>
  )
}
