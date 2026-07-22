import { AdminLoadingState } from './AdminLoadingState'

/**
 * In-content pending state for lazy admin child routes. Renders inside the
 * persistent shell's scroll area (the child `<Outlet/>` region), so switching
 * editors never blanks the sidebar/topbar with a full-screen loader.
 */
export function AdminEditorLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <AdminLoadingState message="Loading editor…" />
    </div>
  )
}
