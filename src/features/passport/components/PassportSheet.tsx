import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import { cn } from '@/shared/lib/cn'

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
          'absolute inset-x-0 bottom-0 max-h-[86svh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface)] pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[0_-24px_70px_rgba(0,0,0,0.55)] outline-none',
          'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out',
          entered ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Grab bar + close */}
        <div className="sticky top-0 z-10 bg-[var(--color-surface)] px-5 pb-3 pt-3">
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
              className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="px-5 pt-2">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
