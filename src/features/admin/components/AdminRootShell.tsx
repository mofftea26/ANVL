import type { ReactNode } from 'react'
import { AppErrorBoundary } from '@/app/components/AppErrorBoundary'
import { RouteAnalytics } from '@/app/providers/RouteAnalytics'
import { AdminAuthProvider } from '@/features/admin/auth/AdminAuthProvider'
import { AdminThemeProvider } from '@/features/admin/theme/AdminThemeProvider'
import { ADMIN_MAIN_ID } from '@/features/admin/components/adminMainId'

const ADMIN_LOGIN_PATH = '/admin/login'

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
  // The login page renders bare (see `AdminShellLayout`) and so has no
  // `AdminShell` — and therefore no `#anvl-admin-main` to skip to. Offering a
  // skip link that lands nowhere is worse than offering none.
  const showSkipLink = pathname !== ADMIN_LOGIN_PATH

  return (
    <AdminThemeProvider>
      <AdminAuthProvider>
        <RouteAnalytics />
        {showSkipLink ? (
          <a
            href={`#${ADMIN_MAIN_ID}`}
            className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:border focus:border-[var(--color-line)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:text-[color:var(--color-text)]"
          >
            Skip to content
          </a>
        ) : null}
        {/*
         * A plain <div>, NOT <main>. `AdminShell` renders the real <main>
         * (`#anvl-admin-main`), so a <main> here nested a second one inside it
         * on every admin page — two "main" landmarks, which leaves a screen
         * reader with no unambiguous "jump to the content" target. This wrapper
         * carries no styling, so demoting it is purely structural.
         */}
        <div>
          <AppErrorBoundary resetKey={pathname}>{children}</AppErrorBoundary>
        </div>
      </AdminAuthProvider>
    </AdminThemeProvider>
  )
}

export default AdminRootShell
