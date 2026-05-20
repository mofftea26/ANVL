import { Save } from 'lucide-react'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { cn } from '@/shared/lib/cn'

export type AdminSaveBarProps = {
  onSave: () => void
  saveLabel?: string
  error?: string | null
  saving?: boolean
  className?: string
}

export function AdminSaveBar({
  onSave,
  saveLabel = 'Save',
  error,
  saving = false,
  className,
}: AdminSaveBarProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-4 mt-6 border-t border-[var(--color-line)] bg-[var(--color-bg)]/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6',
        className,
      )}
    >
      {error ? (
        <p
          role="alert"
          className="mb-3 text-xs text-red-300/90"
          data-testid="admin-save-bar-error"
        >
          {error}
        </p>
      ) : null}
      <AdminTopbarChipButton
        type="button"
        variant="primary"
        loading={saving}
        icon={<Save size={14} />}
        onClick={onSave}
      >
        {saveLabel}
      </AdminTopbarChipButton>
    </div>
  )
}
