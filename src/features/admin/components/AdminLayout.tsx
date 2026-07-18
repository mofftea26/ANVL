import type { PropsWithChildren, ReactNode } from 'react'

import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { AdminSyncIndicator } from '@/features/admin/components/AdminSyncIndicator'

import { AdminShell } from './AdminShell'

interface AdminLayoutProps {
  title: string
  description?: ReactNode
  /**
   * - `default` — centered single column (`max-w-5xl`).
   * - `wide` — full-height flex shell (legacy split editors).
   * - `workspace` — wide two-zone shell that fills ultra-wide screens; pair the
   *   page content with {@link AdminWorkspace} to dock a contextual side rail.
   */
  layout?: 'default' | 'wide' | 'workspace'
}

export function AdminLayout({
  title,
  description,
  layout = 'default',
  children,
}: PropsWithChildren<AdminLayoutProps>) {
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
          <AdminShell title={title} description={description} layout={layout}>
            {children}
          </AdminShell>
        </>
      )}
    </div>
  )
}
