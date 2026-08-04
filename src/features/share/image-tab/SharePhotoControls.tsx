import { useRef } from 'react'
import { ImagePlus, Loader2, RefreshCw, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

/**
 * The photo affordance, mounted ON the preview stage.
 *
 * Adding a photo is the highest-value action in the tab — it swaps the hero of
 * whichever layout is chosen, and it is the one workaround for a piece image
 * that taints the canvas — so it sits on the artwork it changes, not in a card
 * further down the scroller where you had to scroll past the thing you were
 * judging to find the thing that changes it. Icon-led, one glyph, no copy.
 *
 * It no longer UNLOCKS anything. It used to gate seven of ten layouts behind
 * itself; all seven now work either way, so this control changes the picture
 * and nothing else about the sheet.
 *
 * READS ON ANYTHING. The plate has to survive both a near-black brand backdrop
 * and a blown-out user photo, so it carries a double stroke: a light inner
 * hairline (visible on the photo) and a dark outer hairline (visible on the
 * backdrop), over a blurred translucent fill. Neither alone is enough.
 *
 * DOES NOT COVER THE ARTWORK IT SITS ON — and that is MEASURED, not hoped for.
 * The worst case is the smallest plate holding the widest render: a 390px
 * phone at the square format, where the stage is 318×253 and the render fills
 * 229×229 of it with its left edge at x≈44. At 64px on a 12px inset the button
 * reached x=76 and buried roughly 84 canvas pixels — about three glyphs — of
 * the FEAT headline every preset sets at canvas x=64. So below `lg` it drops to
 * the 44px touch floor on an 8px inset, which puts its right edge at x=52
 * against a headline starting at x≈58: clear at all three formats, at the
 * narrowest viewport, with the smallest plate. From `lg` the plate is three
 * times the size and the button takes its full 64px back.
 */

export interface SharePhotoControl {
  hasPhoto: boolean
  previewUrl: string | null
  pending: boolean
  error: string | null
  onPick: (file: File | null | undefined) => void
  onClear: () => void
}

const PLATE = cn(
  'bg-[color-mix(in_oklab,var(--color-bg)_62%,transparent)] backdrop-blur-md',
  'ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-accent)_34%,transparent)]',
  'shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--color-bg)_80%,transparent),0_16px_34px_-14px_rgba(0,0,0,0.95)]',
)

const ACTION = cn(
  'focus-ring relative grid place-items-center rounded-full',
  'motion-safe:transition-transform motion-safe:hover:scale-[1.06] motion-safe:active:scale-95',
)

export function SharePhotoControls({ photo }: { photo: SharePhotoControl }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const openPicker = () => fileRef.current?.click()

  return (
    <div className="absolute bottom-2 left-2 z-[1] lg:bottom-3 lg:left-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        // The visible button is the control; leaving the input in the tab order
        // too would put an invisible stop on the stage. `.click()` still works.
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          photo.onPick(event.target.files?.[0])
          // Re-picking the same file does not fire `change` unless the input is
          // reset first.
          event.target.value = ''
        }}
      />

      {photo.hasPhoto ? (
        // Replace and remove, side by side in the spot the add button held —
        // and deliberately smaller than it was, because the result is now the
        // thing to look at and these two are corrections to it.
        <div className={cn('flex items-center gap-1 rounded-full p-1', PLATE)}>
          <button
            type="button"
            aria-label="Replace your photo"
            aria-busy={photo.pending || undefined}
            onClick={openPicker}
            className={cn(ACTION, 'h-11 w-11 overflow-hidden text-[var(--color-text)]')}
          >
            {/* The thumbnail says WHICH photo this button swaps out, scrimmed
                so the glyph on top never fights a bright picture. */}
            {photo.previewUrl ? (
              <img
                src={photo.previewUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-bg)_62%,transparent)]"
            />
            {photo.pending ? (
              <Loader2
                size={ICON_SIZE.lg}
                aria-hidden="true"
                className="relative motion-safe:animate-spin"
              />
            ) : (
              <RefreshCw size={ICON_SIZE.lg} aria-hidden="true" className="relative" />
            )}
          </button>

          <span
            aria-hidden="true"
            className="h-6 w-px bg-[color-mix(in_oklab,var(--color-accent)_26%,transparent)]"
          />

          <button
            type="button"
            aria-label="Remove your photo"
            onClick={photo.onClear}
            className={cn(
              ACTION,
              'h-11 w-11 text-[var(--color-danger)]',
              'hover:bg-[color-mix(in_oklab,var(--color-danger)_18%,transparent)]',
            )}
          >
            <Trash2 size={ICON_SIZE.lg} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Add your photo"
          aria-busy={photo.pending || undefined}
          onClick={openPicker}
          className={cn(
            ACTION,
            PLATE,
            // The 44px touch floor where the plate is small enough for the
            // button to reach the artwork, 64px — the primary invitation of the
            // tab, sized well past the floor — where it is not.
            'h-11 w-11 lg:h-16 lg:w-16',
            'text-[var(--color-highlight-bright)]',
            'ring-[color-mix(in_oklab,var(--color-highlight)_60%,transparent)]',
            'shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--color-bg)_80%,transparent),0_0_26px_-6px_color-mix(in_oklab,var(--color-highlight)_70%,transparent),0_16px_34px_-14px_rgba(0,0,0,0.95)]',
          )}
        >
          {/* One glyph at one size in both plates: 26px reads as the largest
              thing on the stage at 44px and still carries the 64px one. */}
          {photo.pending ? (
            <Loader2 size={ICON_SIZE.xl} aria-hidden="true" className="motion-safe:animate-spin" />
          ) : (
            <ImagePlus size={ICON_SIZE.xl} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
}
