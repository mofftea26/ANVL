import { useBlocker } from '@tanstack/react-router'
import { useIsAnyAdminEditorDirty } from '@/features/admin/hooks/useAdminDirtyRegistry'

const CONFIRM_MESSAGE =
  'You have unsaved changes in this editor. Leave without saving?'

/**
 * Mounted once at the admin layout level (`src/routes/admin/route.tsx`).
 * Warns before in-app navigation away from any editor with unsaved changes
 * (registered via `useRegisterAdminDirty`) and before closing/refreshing the
 * tab. Renders nothing — it's a behavior-only guard.
 *
 * No custom resolver: `shouldBlockFn` handles the confirm itself via
 * `window.confirm` for in-app navigation (TanStack Router does not show any
 * prompt automatically without `withResolver`); the browser's own native
 * "leave site?" prompt covers the `beforeunload` (tab close/refresh) case.
 */
export function AdminUnsavedChangesGuard() {
  const isDirty = useIsAnyAdminEditorDirty()

  useBlocker({
    shouldBlockFn: () => {
      if (!isDirty) return false
      return !window.confirm(CONFIRM_MESSAGE)
    },
    enableBeforeUnload: isDirty,
  })

  return null
}
