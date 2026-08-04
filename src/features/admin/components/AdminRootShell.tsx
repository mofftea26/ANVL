import type { ReactNode } from 'react'
import { AppErrorBoundary } from '@/app/components/AppErrorBoundary'
import { RouteAnalytics } from '@/app/providers/RouteAnalytics'
import { AdminAuthProvider } from '@/features/admin/auth/AdminAuthProvider'
import { AdminThemeProvider } from '@/features/admin/theme/AdminThemeProvider'

/**
 * The `/admin/*` branch of the root layout, extracted so `__root.tsx` can reach
 * it through `lazy()` instead of a static import.
 *
 * WHY THIS FILE EXISTS (F-06): `__root.tsx` renders on EVERY route, and it used
 * to `import { AdminAuthProvider }` / `{ AdminThemeProvider }` at module scope.
 * `AdminAuthProvider` in turn statically imports `getAdminSupabaseBrowserClient`,
 * `hydrateAdminCmsFromSupabase` and `clearCmsProfileRoleCache` — so the entire
 * admin CMS remote-sync module, carrying `@supabase/supabase-js`
 * (~98 KB gzip), sat in the storefront's static import graph. Rolldown said so
 * out loud on every build:
 *
 *   [INEFFECTIVE_DYNAMIC_IMPORT] adminCmsRemoteSync.ts is dynamically imported
 *   by … but also statically imported by AdminAuthProvider.tsx
 *
 * It also broke CLAUDE.md's hardest rule — storefront code must not import
 * `src/features/admin/**`. Routing the whole branch through one lazy boundary
 * fixes both: a shopper never downloads the admin auth stack, and the boundary
 * is a single obvious place rather than two innocuous-looking import lines.
 *
 * The admin wears its own fixed Studio identity — never the storefront theme,
 * which appears only inside the theme editor's scoped preview.
 */
export function AdminRootShell({
  pathname,
  children,
}: {
  /** Resets the error boundary on navigation between admin editors. */
  pathname: string
  children: ReactNode
}) {
  return (
    <AdminThemeProvider>
      <AdminAuthProvider>
        <RouteAnalytics />
        <main>
          <AppErrorBoundary resetKey={pathname}>{children}</AppErrorBoundary>
        </main>
      </AdminAuthProvider>
    </AdminThemeProvider>
  )
}

export default AdminRootShell
