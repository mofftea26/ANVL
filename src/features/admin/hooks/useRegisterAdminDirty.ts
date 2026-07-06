import { useEffect } from 'react'
import { useAdminDirtyRegistry } from './useAdminDirtyRegistry'

/**
 * Registers this editor's unsaved-changes state with the shared admin dirty
 * registry. Call with a stable `id` (unique per editor, e.g. `'theme'`) and
 * the editor's own already-computed `isDirty` boolean.
 */
export function useRegisterAdminDirty(id: string, isDirty: boolean): void {
  const setDirty = useAdminDirtyRegistry((s) => s.setDirty)

  useEffect(() => {
    setDirty(id, isDirty)
  }, [id, isDirty, setDirty])

  // Clear this editor's dirty flag on unmount so navigating away from it
  // (once already permitted) doesn't leave a stale entry blocking the next
  // navigation.
  useEffect(() => {
    return () => setDirty(id, false)
  }, [id, setDirty])
}
