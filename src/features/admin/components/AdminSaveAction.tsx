import { Check, Save } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { ICON_SIZE } from '@/shared/lib/iconSize'

export type AdminSaveActionProps = {
  onSave: () => void
  saving: boolean
  /** Brief post-save confirmation flash (swaps the icon for a check). */
  showSuccess?: boolean
  /** Unsaved changes — shows a copper dot on the control. */
  dirty?: boolean
  /** Accessible name + tooltip (e.g. "Save theme"). */
  label?: string
}

/**
 * Icon-only Save control for the admin topbar page-actions slot. One shared
 * shape across every editor: floppy icon, spinner while saving, check flash on
 * success, and a copper "unsaved" dot while dirty. 44px touch target
 * (`size="icon"`), named for screen readers via aria-label + title.
 */
export function AdminSaveAction({
  onSave,
  saving,
  showSuccess = false,
  dirty = false,
  label = 'Save',
}: AdminSaveActionProps) {
  return (
    <span className="relative inline-flex">
      <Button
        type="button"
        variant="primary"
        size="icon"
        disabled={saving}
        loading={saving}
        onClick={onSave}
        aria-label={label}
        title={label}
      >
        {showSuccess ? (
          <Check size={ICON_SIZE.md} aria-hidden="true" />
        ) : (
          <Save size={ICON_SIZE.md} aria-hidden="true" />
        )}
      </Button>
      {dirty && !saving ? (
        <span
          data-testid="admin-save-dirty-dot"
          aria-hidden="true"
          className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[var(--color-bg)] bg-[var(--color-accent)]"
        />
      ) : null}
    </span>
  )
}
