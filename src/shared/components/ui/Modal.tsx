import {
  type PropsWithChildren,
  type ReactNode,
  useId,
  useRef,
} from 'react'
import { cn } from '@/shared/lib/cn'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'

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

  useDialogFocusTrap({ open, panelRef, onClose })

  if (!open) return null

  const labelledByProp =
    ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy.trim() : undefined

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 outline-none',
          'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-300 motion-reduce:transition-none',
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
    </div>
  )
}
