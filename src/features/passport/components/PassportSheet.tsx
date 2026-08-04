import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@/shared/icons'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

/**
 * Length of the fade ramp at the top of the scrolling body. It is ALSO that
 * body's top padding, and the two must stay equal: at scrollTop 0 the ramp then
 * covers nothing but empty space, so no first line is ever washed out at rest —
 * copy only dissolves once it has scrolled up under the header.
 */
const FADE_TOP = '1.5rem'

/**
 * Bottom ramp — the "there is more below" tell. Held at or under the body's
 * bottom padding floor (1.25rem) so that once the user reaches the end the last
 * line sits on padding, at full strength, never half-faded.
 */
const FADE_BOTTOM = '1.25rem'

/**
 * Alpha ramp, not brand colour. A gradient mask resolves `mask-mode:
 * match-source` to alpha, so the black stops mean "opaque" and `transparent`
 * means "hidden" — the stops carry no colour of their own. That is why this
 * beats a scrim: transparent mask pixels reveal the panel's own
 * `--color-surface`, so the dissolve is exact in oath-dark, bone-light and any
 * runtime CMS palette with no second colour to keep in sync.
 */
const BODY_MASK = `linear-gradient(to bottom, transparent 0, rgba(0, 0, 0, 0.45) calc(${FADE_TOP} * 0.5), #000 ${FADE_TOP}, #000 calc(100% - ${FADE_BOTTOM}), transparent 100%)`

/**
 * The mask is painted in the SCROLLER's own box, not in the scrolled content,
 * so the ramp stays pinned to the visible top edge while content travels
 * through it — that is the whole trick that turns the header's hard 1px cut
 * into a dissolve. It is a static paint-time property (no transition, no
 * animation), so it renders identically under `prefers-reduced-motion: reduce`.
 * The `-webkit-` twin covers iOS < 15.4.
 */
const BODY_FADE_STYLE: CSSProperties = {
  paddingTop: FADE_TOP,
  maskImage: BODY_MASK,
  WebkitMaskImage: BODY_MASK,
}

/**
 * Mobile bottom sheet for passport sections — the phone-native way to open a
 * bento card. Slides up over the page (CSS transform only), traps focus,
 * closes on Escape/backdrop/the grab-bar button, and scrolls internally when
 * a section runs long.
 */
export function PassportSheet({
  open,
  onClose,
  eyebrow,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Mount flag so the enter transition plays from translate-y-full.
  const [entered, setEntered] = useState(false)

  useDialogFocusTrap({ open, panelRef, onClose })

  // Plain overflow lock — the body-position:fixed approach (useLockPageScroll)
  // yanks the page back to the top on open, which is exactly wrong for a
  // sheet that opens mid-scroll. html overflow:hidden keeps the position.
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[85]">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/60 motion-safe:transition-opacity motion-safe:duration-300',
          entered ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          // A flex column, NOT a scroller: the header is a non-scrolling
          // sibling and only the body scrolls, so no content can ever travel
          // through the header's box. `overflow-hidden` keeps the rounded top
          // edge clipping that `overflow-y-auto` used to provide.
          // The `bg-` here is load-bearing for the body's fade — the mask has
          // no colour of its own, it dissolves into THIS surface. Do not make
          // the panel transparent or re-add a background to the header.
          'absolute inset-x-0 bottom-0 flex max-h-[86svh] flex-col overflow-hidden rounded-t-2xl bg-[var(--color-surface)] shadow-[0_-24px_70px_rgba(0,0,0,0.55)] outline-none',
          'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out',
          entered ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Grab bar + close. Outside the scroller, so it needs no background
            of its own and cannot be overpainted by a z-indexed section child. */}
        <div className="shrink-0 px-5 pb-3 pt-3">
          <div
            aria-hidden="true"
            className="mx-auto h-1 w-10 rounded-full bg-[var(--color-line)]"
          />
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              {eyebrow ? (
                <p className="anvl-micro text-[10px] text-[var(--color-highlight-bright)]">
                  {eyebrow}
                </p>
              ) : null}
              <h2 className="anvl-heading mt-0.5 text-2xl text-[var(--color-heading)]">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close section"
              className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]"
            >
              <X size={ICON_SIZE.lg} aria-hidden="true" />
            </button>
          </div>
        </div>
        {/* The only scroll area. `min-h-0` is load-bearing: a flex item defaults
            to `min-height:auto`, would refuse to shrink under the panel's
            max-height, and the panel's `overflow-hidden` would then silently
            clip the tail of long sections with no way to scroll to it. */}
        <div
          style={BODY_FADE_STYLE}
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]',
            // A mask softens the top of this element's own scrollbar too.
            // Invisible on phones (overlay bars), but this sheet also serves
            // tablets, where the global `scrollbar-width: thin` would paint a
            // real bar with a smudged top. Same treatment as the other masked
            // scroller in this feature (PassportArmoryPanel); the bottom ramp
            // carries the "more below" affordance instead.
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
