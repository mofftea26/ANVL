import type { ReactNode } from 'react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { Modal } from '@/shared/components/ui/Modal'

export type AdminConfirmDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  cancelLabel?: string
  confirmLabel: string
  onConfirm: () => void
  confirmVariant?: 'primary' | 'destructive'
  confirmDisabled?: boolean
  confirmLoading?: boolean
  /** Extra body between copy and footer (e.g. date picker). */
  footerBefore?: ReactNode
}

/**
 * Standard admin confirm modal — single title via {@link Modal}, forged footer actions.
 */
export function AdminConfirmDialog({
  open,
  onClose,
  title,
  children,
  cancelLabel = 'Cancel',
  confirmLabel,
  onConfirm,
  confirmVariant = 'primary',
  confirmDisabled = false,
  confirmLoading = false,
  footerBefore,
}: AdminConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4 motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:transition-none">
        <div className="text-sm text-[var(--color-text-muted)]">{children}</div>
        {footerBefore}
        <div className="flex justify-end gap-2">
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={confirmLoading}
            onClick={onClose}
          >
            {cancelLabel}
          </AdminButton>
          <AdminButton
            type="button"
            variant={confirmVariant}
            size="sm"
            loading={confirmLoading}
            disabled={confirmDisabled || confirmLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </Modal>
  )
}
