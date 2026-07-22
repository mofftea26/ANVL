import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'

/**
 * Wizard-scoped unsaved-changes registry (D6).
 *
 * Setup-wizard steps own their working copies (`useSetupBlobStep`), so the
 * hosting wizard has no idea whether the active step is dirty. Each step hook
 * registers `{ dirty, save }` here; the wizard aggregates the flags to guard
 * close/step-change with a Save / Discard / Continue-editing choice, and
 * mirrors the aggregate into the admin-wide dirty registry for route
 * navigation + tab close.
 *
 * Only the ACTIVE step's hooks are mounted at any moment (the wizard renders
 * one step body), so "all registered dirty entries" == "the active step's
 * dirty working copies".
 */

export interface WizardDirtyEntry {
  dirty: boolean
  /** Persist the entry's working copy; resolves `false` on failure (already toasted). */
  save: () => Promise<boolean>
}

export interface WizardDirtyRegistry {
  register: (id: string, entry: WizardDirtyEntry) => void
  unregister: (id: string) => void
}

const WizardDirtyContext = createContext<WizardDirtyRegistry | null>(null)

/** Null outside a wizard — registration is a silent no-op there. */
export function useWizardDirtyRegistry(): WizardDirtyRegistry | null {
  return useContext(WizardDirtyContext)
}

export interface WizardDirtyState {
  /** True while any mounted (= active-step) working copy has unsaved edits. */
  anyDirty: boolean
  /** Saves every dirty entry; `false` as soon as one fails. */
  saveDirty: () => Promise<boolean>
  /** Forget the current entries' dirty flags (Discard path). */
  discardDirty: () => void
  /** Provider wiring the step hooks to this aggregate. */
  Provider: (props: PropsWithChildren) => React.ReactElement
}

export function useProvideWizardDirty(): WizardDirtyState {
  const [entries, setEntries] = useState<Record<string, WizardDirtyEntry>>({})
  // Latest entries for the async save without re-creating callbacks per edit.
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  const register = useCallback((id: string, entry: WizardDirtyEntry) => {
    setEntries((prev) =>
      prev[id]?.dirty === entry.dirty && prev[id]?.save === entry.save
        ? prev
        : { ...prev, [id]: entry },
    )
  }, [])

  const unregister = useCallback((id: string) => {
    setEntries((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const registry = useMemo<WizardDirtyRegistry>(
    () => ({ register, unregister }),
    [register, unregister],
  )

  const anyDirty = Object.values(entries).some((entry) => entry.dirty)

  const saveDirty = useCallback(async (): Promise<boolean> => {
    for (const entry of Object.values(entriesRef.current)) {
      if (!entry.dirty) continue
      const ok = await entry.save()
      if (!ok) return false
    }
    return true
  }, [])

  const discardDirty = useCallback(() => {
    setEntries((prev) => {
      const next: Record<string, WizardDirtyEntry> = {}
      for (const [id, entry] of Object.entries(prev)) {
        next[id] = entry.dirty ? { ...entry, dirty: false } : entry
      }
      return next
    })
  }, [])

  const Provider = useCallback(
    ({ children }: PropsWithChildren) => (
      <WizardDirtyContext.Provider value={registry}>{children}</WizardDirtyContext.Provider>
    ),
    [registry],
  )

  return { anyDirty, saveDirty, discardDirty, Provider }
}
