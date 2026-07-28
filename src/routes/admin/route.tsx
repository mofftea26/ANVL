import { Suspense, lazy } from 'react'
import { createFileRoute, redirect, useRouterState } from '@tanstack/react-router'
import { AdminPageActionsProvider } from '@/features/admin/components/AdminPageActionsContext'
import { AdminErrorBoundary } from '@/app/components/AdminErrorBoundary'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminUnsavedChangesGuard } from '@/features/admin/components/AdminUnsavedChangesGuard'
import { getCachedAdminSession } from '@/features/admin/auth/adminAuthCache'

const ADMIN_LOGIN_PATH = '/admin/login'

/**
 * The persistent shell (sidebar + topbar + preview panel) is hoisted to this
 * layout route and lazy-loaded: admin chrome must never reach the storefront
 * entry chunk (PERF-01), and once loaded it survives every child navigation —
 * only the content region under the child `<Outlet/>` swaps.
 */
const AdminShellLayout = lazy(() =>
  import('@/features/admin/components/AdminShellLayout').then((m) => ({
    default: m.AdminShellLayout,
  })),
)

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
    const result = await getCachedAdminSession()
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
        <AdminUnsavedChangesGuard />
        <Suspense fallback={<AdminRoutePending />}>
          <AdminShellLayout />
        </Suspense>
      </AdminPageActionsProvider>
    </AdminErrorBoundary>
  )
}
