import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

type SetAdminPageActions = (next: ReactNode | null) => void

const AdminPageActionsSetContext = createContext<SetAdminPageActions | null>(
  null,
)

const AdminPageActionsSlotContext = createContext<ReactNode | null>(null)

export function AdminPageActionsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [actions, setActionsState] = useState<ReactNode | null>(null)

  const setActions = useCallback<SetAdminPageActions>((next) => {
    setActionsState((prev) => (Object.is(prev, next) ? prev : next))
  }, [])

  return (
    <AdminPageActionsSetContext.Provider value={setActions}>
      <AdminPageActionsSlotContext.Provider value={actions}>
        {children}
      </AdminPageActionsSlotContext.Provider>
    </AdminPageActionsSetContext.Provider>
  )
}

/** Register route-level icon actions for {@link AdminTopbar}. Clears on unmount via cleanup. SSR-safe (starts null). */
export function useAdminPageActions(): SetAdminPageActions {
  const setActions = useContext(AdminPageActionsSetContext)
  if (!setActions) {
    throw new Error(
      'useAdminPageActions must be used within AdminPageActionsProvider',
    )
  }
  return setActions
}

/** Read-only slot for the topbar (and tests). Returns null outside the provider. */
export function useAdminPageActionsSlot(): ReactNode | null {
  return useContext(AdminPageActionsSlotContext)
}
