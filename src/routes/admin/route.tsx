import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { AdminPageActionsProvider } from '@/features/admin/components/AdminPageActionsContext'
import { AdminErrorBoundary } from '@/app/components/AdminErrorBoundary'

export const Route = createFileRoute('/admin')({
  component: AdminRouteShell,
})

function AdminRouteShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  return (
    <AdminErrorBoundary resetKey={pathname}>
      <AdminPageActionsProvider>
        <Outlet />
      </AdminPageActionsProvider>
    </AdminErrorBoundary>
  )
}
