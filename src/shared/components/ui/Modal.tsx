import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { ModalForgeEffect } from './ModalForgeEffect'

/** How long the ember swarm owns the open (ModalForgeEffect's DURATION_MS). */
const FORGE_MS = 1000

type ModalProps = PropsWithChildren<{
  open: boolean
  onClose: () => void
  /**
   * Optional dialog heading. When provided, renders as `<h2>` inside the
   * panel and is wired to `aria-labelledby` automatically. Pass a string
   * (most common) or any ReactNode for richer markup.
   */
  title?: ReactNode
  /**
   * Explicit `aria-labelledby` ID — use when the dialog already has a
   * visible heading rendered by the caller. Mutually exclusive with `title`.
   */
  'aria-labelledby'?: string
  /**
   * Optional ID of the element describing the dialog — forwarded to
   * `role="dialog"` for screen readers (PAIR with visible body copy).
   */
  'aria-describedby'?: string
  /** Aria label fallback when no `title` / `aria-labelledby` is set. */
  'aria-label'?: string
  className?: string
}>

/**
 * Accessible modal dialog with full focus management (audit RESP-01).
 * - Traps Tab/Shift+Tab inside the panel.
 * - Closes on Escape.
 * - Moves focus into the dialog on open, restores focus on close
 *   (delegated to {@link useDialogFocusTrap}).
 * - Exposes `aria-modal="true"` and a labelled-by relationship via the
 *   `title` prop (recommended) or an explicit `aria-labelledby` ID.
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const generatedTitleId = useId()
  const hasTitle = title != null && title !== ''
  const titleHeadingId = hasTitle ? generatedTitleId : undefined
  const reducedMotion = useReducedMotion()

  useDialogFocusTrap({ open, panelRef, onClose })

  // Every open forges the panel out of embers (ModalForgeEffect draws the
  // swarm; `.anvl-modal-forge` holds the panel back until they land).
  // Reduced motion skips the whole ceremony.
  const [forging, setForging] = useState(false)
  useEffect(() => {
    if (!open || reducedMotion) return
    setForging(true)
    const timer = setTimeout(() => setForging(false), FORGE_MS)
    return () => {
      clearTimeout(timer)
      setForging(false)
    }
  }, [open, reducedMotion])

  // Dialogs are interaction-driven (never open during SSR), but guard anyway.
  if (!open || typeof document === 'undefined') return null

  const labelledByProp =
    ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy.trim() : undefined

  // Portal to <body>: callers render modals inside cards/sections that create
  // stacking contexts (e.g. AdminCard's z-[1]), which trapped the fixed
  // overlay beneath sibling content. z-[90] clears admin chrome (topbar z-30,
  // sync indicator z-50). Transient popovers (Select/DatePicker/AdminPopover)
  // sit at z-[100] so they stay clickable when opened inside a modal.
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        className="anvl-modal-backdrop-fade absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      {forging ? <ModalForgeEffect targetRef={panelRef} /> : null}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          // Borderless by design — depth comes from the shadow, not a line.
          'relative w-full max-w-lg rounded-xl bg-[var(--color-surface)] p-6 shadow-[0_32px_90px_-18px_rgba(0,0,0,0.85)] outline-none',
          'motion-safe:transition-shadow motion-safe:duration-300 motion-reduce:transition-none',
          // Materializes as the ember swarm lands (no-op under reduced motion).
          'anvl-modal-forge',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={
          labelledByProp || hasTitle ? undefined : ariaLabel?.trim() || 'Dialog'
        }
        aria-labelledby={labelledByProp ?? titleHeadingId}
        aria-describedby={
          ariaDescribedBy && ariaDescribedBy.trim()
            ? ariaDescribedBy.trim()
            : undefined
        }
      >
        {hasTitle ? (
          <h2 id={titleHeadingId} className="anvl-heading mb-4 text-2xl">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  )
}
