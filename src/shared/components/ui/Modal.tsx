import { type PropsWithChildren, useRef } from 'react'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'

export type ModalAriaProps = {
  'aria-labelledby'?: string
  'aria-label'?: string
}

export type ModalProps = PropsWithChildren<
  { open: boolean; onClose: () => void } & ModalAriaProps
>

/**
 * Accessible modal: focus moves to the first focusable control on open,
 * Tab cycles within the dialog, Escape closes, and focus restores on close.
 */
export function Modal({
  open,
  onClose,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocusTrap({ open, panelRef, onClose })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 cursor-pointer bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={
          ariaLabelledBy && ariaLabelledBy.trim()
            ? undefined
            : ariaLabel?.trim() || 'Dialog'
        }
        aria-labelledby={
          ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy : undefined
        }
      >
        {children}
      </div>
    </div>
  )
}
