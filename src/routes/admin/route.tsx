import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { AdminAuthProvider } from '@/features/admin/auth/AdminAuthProvider'
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
    <AdminAuthProvider>
      <AdminErrorBoundary resetKey={pathname}>
        <AdminPageActionsProvider>
          <Outlet />
        </AdminPageActionsProvider>
      </AdminErrorBoundary>
    </AdminAuthProvider>
  )
}
