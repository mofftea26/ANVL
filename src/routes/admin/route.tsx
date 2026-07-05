import { Outlet, createFileRoute, redirect, useRouterState } from '@tanstack/react-router'
import { AdminPageActionsProvider } from '@/features/admin/components/AdminPageActionsContext'
import { AdminErrorBoundary } from '@/app/components/AdminErrorBoundary'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { getAdminSessionServerFn } from '@/features/admin/auth/adminAuth'

const ADMIN_LOGIN_PATH = '/admin/login'

/**
 * Server-validated guard for every `/admin/*` route. Runs during SSR on the
 * first page load and again (via the server-function RPC) on every
 * client-side navigation within `/admin` — replaces the old client-only
 * `ProtectedAdminRoute` component, which could render protected UI briefly
 * before redirecting since it only knew auth state after `localStorage`
 * hydration.
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    const result = await getAdminSessionServerFn()
    if (location.pathname === ADMIN_LOGIN_PATH) {
      if (result.authenticated) {
        throw redirect({ to: '/admin', replace: true })
      }
      return
    }
    if (!result.authenticated) {
      throw redirect({ to: ADMIN_LOGIN_PATH, replace: true })
    }
  },
  pendingComponent: AdminRoutePending,
  component: AdminRouteShell,
})

function AdminRoutePending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <AdminLoadingState message="Loading admin…" />
    </div>
  )
}

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
