import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AdminPageActionsContextValue = {
  actions: ReactNode | null
  setActions: (next: ReactNode | null) => void
}

const AdminPageActionsContext =
  createContext<AdminPageActionsContextValue | null>(null)

export function AdminPageActionsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [actions, setActionsState] = useState<ReactNode | null>(null)

  const setActions = useCallback((next: ReactNode | null) => {
    setActionsState(next)
  }, [])

  const value = useMemo(
    () => ({ actions, setActions }),
    [actions, setActions],
  )

  return (
    <AdminPageActionsContext.Provider value={value}>
      {children}
    </AdminPageActionsContext.Provider>
  )
}

/** Register route-level icon actions for {@link AdminTopbar}. Clears on unmount via cleanup. SSR-safe (starts null). */
export function useAdminPageActions(): (
  next: ReactNode | null,
) => void {
  const ctx = useContext(AdminPageActionsContext)
  if (!ctx) {
    throw new Error(
      'useAdminPageActions must be used within AdminPageActionsProvider',
    )
  }
  return ctx.setActions
}

/** Read-only slot for the topbar (and tests). Returns null outside the provider. */
export function useAdminPageActionsSlot(): ReactNode | null {
  const ctx = useContext(AdminPageActionsContext)
  return ctx?.actions ?? null
}
