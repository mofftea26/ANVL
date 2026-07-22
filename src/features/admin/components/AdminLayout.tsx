import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/cn'

interface AdminLayoutProps {
  /**
   * Content-column mode inside the persistent shell's scroll area:
   * - `default` — centered single column (`max-w-5xl`).
   * - `workspace` — wide two-zone column that fills ultra-wide screens; pair
   *   the page content with {@link AdminWorkspace} to dock a contextual rail.
   */
  layout?: 'default' | 'workspace'
}

/**
 * Per-page content wrapper. The admin chrome (sidebar, topbar, preview panel,
 * scroll container) lives ONCE in the route-level shell
 * (`src/routes/admin/route.tsx` → `AdminShellLayout`) and persists across
 * child navigation — this component only sets the content column width.
 * Page title/description render in the persistent `AdminTopbar`, resolved
 * from `adminNav.ts`.
 */
export function AdminLayout({
  layout = 'default',
  children,
}: PropsWithChildren<AdminLayoutProps>) {
  return (
    <div
      className={cn(
        'mx-auto min-w-0 w-full',
        layout === 'workspace'
          ? 'max-w-[110rem] 2xl:max-w-[120rem]'
          : 'max-w-5xl space-y-6',
      )}
    >
      {children}
    </div>
  )
}
