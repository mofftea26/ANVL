import { useBlocker } from '@tanstack/react-router'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { useIsAnyAdminEditorDirty } from '@/features/admin/hooks/useAdminDirtyRegistry'

/**
 * Mounted once at the admin layout level (`src/routes/admin/route.tsx`).
 * Guards in-app navigation away from any editor with unsaved changes
 * (registered via `useRegisterAdminDirty`) with the Studio's own
 * {@link AdminConfirmDialog}: `withResolver` holds the blocked navigation
 * while the dialog is open — "Leave" proceeds, "Stay" (or Escape/backdrop)
 * resets it. The guard is generic across editors and cannot trigger their
 * saves, so it stays a two-choice leave/stay decision.
 *
 * Tab close/refresh keeps the browser's NATIVE "leave site?" prompt via
 * `enableBeforeUnload` — custom UI cannot intercept `beforeunload` (allowed
 * native-dialog exception).
 */
export function AdminUnsavedChangesGuard() {
  const isDirty = useIsAnyAdminEditorDirty()

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: isDirty,
    withResolver: true,
  })

  return (
    <AdminConfirmDialog
      open={blocker.status === 'blocked'}
      onClose={() => blocker.reset?.()}
      title="Unsaved changes"
      cancelLabel="Stay"
      confirmLabel="Leave"
      confirmVariant="destructive"
      onConfirm={() => blocker.proceed?.()}
    >
      You have unsaved changes in this editor. Leave without saving?
    </AdminConfirmDialog>
  )
}
