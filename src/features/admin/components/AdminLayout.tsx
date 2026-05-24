import { useState, type PropsWithChildren, type ReactNode } from 'react'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { Drawer } from '@/shared/components/ui/Drawer'
import { cn } from '@/shared/lib/cn'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'

interface AdminLayoutProps {
  title: string
  description?: ReactNode
  layout?: 'default' | 'wide'
}

export function AdminLayout({
  title,
  description,
  layout = 'default',
  children,
}: PropsWithChildren<AdminLayoutProps>) {
  const [navOpen, setNavOpen] = useState(false)
  const { isRemoteCmsReady, remoteHydrateError } = useAdminAuth()

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">
      {!isRemoteCmsReady ? (
        <p
          role="status"
          aria-live="polite"
          className="border-b border-[var(--color-line)] bg-[var(--color-surface-soft)] px-4 py-2 text-center text-[11px] text-[var(--color-text-muted)]"
        >
          Syncing from Supabase…
        </p>
      ) : null}
      {remoteHydrateError ? (
        <p
          role="alert"
          className="border-b border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-2 text-center text-[11px] text-[var(--color-text-muted)]"
        >
          {remoteHydrateError}
        </p>
      ) : null}
      <div className="flex min-h-[100dvh] min-w-0 flex-col">
        <AdminTopbar
          title={title}
          description={description}
          onOpenMenu={() => setNavOpen(true)}
        />
        <main
          className={cn(
            'min-w-0 flex-1 px-4 py-6 pb-8 sm:px-6 lg:px-10 lg:py-10 lg:pb-8',
            layout === 'wide' && 'flex min-h-0 flex-col',
          )}
        >
          <div
            className={cn(
              'mx-auto min-w-0 w-full space-y-6',
              layout === 'wide' ? 'max-w-[1600px]' : 'max-w-5xl',
              layout === 'wide' && 'flex min-h-0 flex-1 flex-col',
            )}
          >
            {children}
          </div>
        </main>
      </div>

      <Drawer
        placement="left"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        aria-label="Admin navigation"
        className="overflow-hidden p-0"
      >
        <AdminSidebar
          density="drawer"
          onNavigate={() => setNavOpen(false)}
          className="h-full max-h-[100dvh] min-h-0 flex-1 overflow-hidden border-r-0"
        />
      </Drawer>
    </div>
  )
}
