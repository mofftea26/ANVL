import { Save, Trash2 } from 'lucide-react'
import { useState, type PropsWithChildren, type ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'

export type AdminEntityCardProps = PropsWithChildren<{
  title: ReactNode
  onSave: () => void | Promise<void>
  saving?: boolean
  saveLabel?: string
  /** Runs the actual delete call. Return `true` to close the confirm dialog (success), `false` to keep it open (failure — the caller already surfaced the error). */
  onConfirmDelete: () => Promise<boolean>
  deleteLabel?: string
  deleteConfirmTitle: string
  deleteConfirmBody: ReactNode
}>

/**
 * Shared chrome for an editable entity card: title + Save/Delete actions +
 * delete confirm dialog, wrapping {@link AdminCard}. Used by admin editors
 * that manage a list of independently-saved records (story acts, cast,
 * chapters) so the card shell isn't hand-rolled per editor.
 */
export function AdminEntityCard({
  title,
  onSave,
  saving = false,
  saveLabel = 'Save',
  onConfirmDelete,
  deleteLabel = 'Delete',
  deleteConfirmTitle,
  deleteConfirmBody,
  children,
}: AdminEntityCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const closed = await onConfirmDelete()
      if (closed) setConfirmOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminCard
      title={title}
      actions={
        <div className="flex gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            loading={saving}
            onClick={() => void onSave()}
          >
            <Save size={14} />
            {saveLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            density="compact"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 size={14} />
            {deleteLabel}
          </Button>
        </div>
      }
    >
      {children}
      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={deleteConfirmTitle}
        confirmLabel={deleteLabel}
        confirmVariant="destructive"
        confirmLoading={deleting}
        onConfirm={() => void handleDelete()}
      >
        {deleteConfirmBody}
      </AdminConfirmDialog>
    </AdminCard>
  )
}
