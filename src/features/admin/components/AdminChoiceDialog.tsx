import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'

export type AdminChoiceDialogProps = {
  open: boolean
  /** Cancel path — backdrop, Escape, and the cancel button all land here. */
  onClose: () => void
  title: string
  children: ReactNode
  /** Primary action (e.g. "Save"). */
  primaryLabel: string
  onPrimary: () => void
  primaryVariant?: 'primary' | 'destructive'
  primaryDisabled?: boolean
  primaryLoading?: boolean
  /** Secondary action (e.g. "Discard"). */
  secondaryLabel: string
  onSecondary: () => void
  /** Cancel label (e.g. "Continue editing"). */
  cancelLabel?: string
}

/**
 * Three-way admin decision modal — primary ("Save"), secondary ("Discard"),
 * and cancel ("Continue editing"). Same {@link Modal} foundation as
 * {@link AdminConfirmDialog} (focus trap, Escape = cancel, `aria-modal`),
 * with a loading state on the primary action.
 */
export function AdminChoiceDialog({
  open,
  onClose,
  title,
  children,
  primaryLabel,
  onPrimary,
  primaryVariant = 'primary',
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
  cancelLabel = 'Cancel',
}: AdminChoiceDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="text-sm text-[var(--color-text-muted)]">{children}</div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            disabled={primaryLoading}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            density="compact"
            disabled={primaryLoading}
            onClick={onSecondary}
          >
            {secondaryLabel}
          </Button>
          <Button
            type="button"
            variant={primaryVariant}
            size="sm"
            density="compact"
            loading={primaryLoading}
            disabled={primaryDisabled || primaryLoading}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
