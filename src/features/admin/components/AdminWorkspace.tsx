import type { ReactNode } from 'react'
import { useAdminPreviewOpen } from '@/features/admin/components/AdminShellContext'
import { cn } from '@/shared/lib/cn'

interface AdminWorkspaceProps {
  /** Primary editing column. */
  children: ReactNode
  /**
   * Contextual side rail — live preview, accessibility report, help, status.
   * Docked sticky beside the primary column on `≥1280px`; stacks below it on
   * smaller widths so nothing is lost when the layout collapses.
   */
  aside?: ReactNode
  /** Accessible label for the rail landmark (defaults to "Workspace context"). */
  asideLabel?: string
  /**
   * What the rail holds. `tips` (default) — help/context panels, hidden while
   * the live-preview panel is open so the preview gets the width. `tools` —
   * functional controls (e.g. the Assets slot panel) that must stay.
   */
  asideKind?: 'tips' | 'tools'
  className?: string
  primaryClassName?: string
  asideClassName?: string
}

/**
 * Shared wide-screen admin shell. Fills the side space on large/ultra-wide
 * monitors with a sticky contextual rail (preview / a11y / help / status) while
 * keeping the primary editing column readable. Below `xl` it gracefully
 * collapses to a single column with the rail content stacked underneath.
 *
 * Width is governed by {@link AdminLayout} `layout="workspace"`; this component
 * only manages the two-zone arrangement so every CMS page opts into the same
 * pattern instead of reinventing it.
 */
export function AdminWorkspace({
  children,
  aside,
  asideLabel = 'Workspace context',
  asideKind = 'tips',
  className,
  primaryClassName,
  asideClassName,
}: AdminWorkspaceProps) {
  const previewOpen = useAdminPreviewOpen()
  const hideAside = asideKind === 'tips' && previewOpen

  if (!aside || hideAside) {
    return (
      <div className={cn('min-w-0', className)} data-testid="admin-workspace">
        {children}
      </div>
    )
  }

  return (
    <div
      data-testid="admin-workspace"
      className={cn(
        'flex min-w-0 flex-col gap-6',
        'xl:grid xl:grid-cols-[minmax(0,1fr)_var(--admin-rail-width)] xl:items-start xl:gap-8',
        'xl:[--admin-rail-width:22rem] 2xl:[--admin-rail-width:24rem]',
        className,
      )}
    >
      <div className={cn('min-w-0', primaryClassName)}>{children}</div>
      <aside
        aria-label={asideLabel}
        className={cn(
          'min-w-0 space-y-4',
          'xl:sticky xl:top-2 xl:max-h-[calc(100dvh-var(--admin-topbar-height)-3rem)] xl:overflow-y-auto xl:overscroll-contain xl:pb-2',
          asideClassName,
        )}
      >
        {aside}
      </aside>
    </div>
  )
}
