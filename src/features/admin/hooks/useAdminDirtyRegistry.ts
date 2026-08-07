import { create } from 'zustand'

interface AdminDirtyRegistryState {
  dirtyIds: Record<string, boolean>
  setDirty: (id: string, isDirty: boolean) => void
}

/**
 * Tracks which admin editors currently have unsaved local changes, so a
 * single layout-level guard (`AdminUnsavedChangesGuard`) can warn before
 * in-app navigation or a tab close/refresh, instead of every editor needing
 * its own guard. Editors register via `useRegisterAdminDirty`.
 */
export const useAdminDirtyRegistry = create<AdminDirtyRegistryState>((set) => ({
  dirtyIds: {},
  setDirty: (id, isDirty) =>
    set((state) => {
      const wasDirty = Boolean(state.dirtyIds[id])
      if (isDirty === wasDirty) return state
      if (isDirty) return { dirtyIds: { ...state.dirtyIds, [id]: true } }
      const next = { ...state.dirtyIds }
      delete next[id]
      return { dirtyIds: next }
    }),
}))

export function useIsAnyAdminEditorDirty(): boolean {
  return useAdminDirtyRegistry((s) => Object.keys(s.dirtyIds).length > 0)
}

/**
 * Non-reactive read of the same flag, for callers outside React's render cycle.
 *
 * `AdminAuthProvider`'s session heartbeat uses it to decide whether its
 * background CMS re-pull is safe: that pull overwrites the localStorage working
 * copy from Supabase, so firing it while an editor holds unsaved changes throws
 * the operator's work away. A hook would force the provider to re-subscribe (and
 * re-create the heartbeat) on every keystroke that flips the flag — this reads
 * the value only at the instant the decision is made.
 */
export function isAnyAdminEditorDirtyNow(): boolean {
  return Object.keys(useAdminDirtyRegistry.getState().dirtyIds).length > 0
}
