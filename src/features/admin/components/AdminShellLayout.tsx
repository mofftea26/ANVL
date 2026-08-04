import type { PropsWithChildren } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'

import { AdminErrorBoundary } from '@/app/components/AdminErrorBoundary'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { AdminShell } from './AdminShell'
import { AdminSyncIndicator } from './AdminSyncIndicator'

const ADMIN_LOGIN_PATH = '/admin/login'

/**
 * Route-level persistent shell: mounts the admin chrome ONCE around the child
 * `<Outlet/>` (see `src/routes/admin/route.tsx`), so navigating between admin
 * pages swaps only the content region — the sidebar (collapse + category
 * state), topbar, and open live-preview panel all survive. `/admin/login`
 * renders bare: the login page brings its own chrome.
 */
export function AdminShellLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname === ADMIN_LOGIN_PATH) return <Outlet />

  return (
    <AdminChrome>
      {/*
       * Content-scoped error boundary. `route.tsx` already wraps the WHOLE
       * shell in one, but that outer boundary is the last resort: when it
       * caught an editor's render error it replaced the sidebar and topbar
       * too, so a single broken page blanked the entire admin and left the
       * operator with no navigation to escape with — the opposite of the
       * persistent-shell contract this component exists to provide.
       *
       * Keyed on `pathname` so navigating to another editor clears the error
       * instead of stranding the operator on it.
       */}
      <AdminErrorBoundary resetKey={pathname}>
        <Outlet />
      </AdminErrorBoundary>
    </AdminChrome>
  )
}

/**
 * The full-viewport admin frame: sync indicator + remote-CMS readiness gate
 * around {@link AdminShell}. Exported for shell-persistence tests.
 */
export function AdminChrome({ children }: PropsWithChildren) {
  const { isRemoteCmsReady, remoteHydrateError } = useAdminAuth()

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <AdminSyncIndicator />
      {!isRemoteCmsReady ? (
        <div
          className="flex h-full items-center justify-center px-6"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-[var(--color-text-muted)]">Loading CMS…</p>
        </div>
      ) : (
        <>
          {remoteHydrateError ? (
            <p role="alert" className="sr-only">
              {remoteHydrateError}
            </p>
          ) : null}
          <AdminShell>{children}</AdminShell>
        </>
      )}
    </div>
  )
}
