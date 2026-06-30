import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * Bridges each account panel's "save" to the single icon button in the sticky
 * account header. Panels register an entry under their tab key; the header
 * renders the active tab's entry (or nothing for read-only tabs like Orders).
 */
export type AccountSaveEntry = { submit: () => void; pending: boolean }

interface AccountSaveState {
  entries: Record<string, AccountSaveEntry>
  setEntry: (key: string, entry: AccountSaveEntry) => void
  removeEntry: (key: string) => void
}

export const useAccountSaveStore = create<AccountSaveState>((set) => ({
  entries: {},
  setEntry: (key, entry) => set((s) => ({ entries: { ...s.entries, [key]: entry } })),
  removeEntry: (key) =>
    set((s) => {
      const next = { ...s.entries }
      delete next[key]
      return { entries: next }
    }),
}))

/** Hook for a panel to publish its save handler + pending state to the header. */
export function useRegisterAccountSave(key: string, submit: () => void, pending: boolean) {
  useEffect(() => {
    useAccountSaveStore.getState().setEntry(key, { submit, pending })
  }, [key, submit, pending])
  useEffect(() => () => useAccountSaveStore.getState().removeEntry(key), [key])
}
