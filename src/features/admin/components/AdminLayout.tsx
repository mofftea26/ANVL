import { useState, type PropsWithChildren, type ReactNode } from 'react'

import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

import { AdminSyncIndicator } from '@/features/admin/components/AdminSyncIndicator'

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

  const isWide = layout === 'wide'



  return (

    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">

      <AdminSyncIndicator />

      {!isRemoteCmsReady ? (

        <div

          className="flex h-full items-center justify-center px-6"

          role="status"

          aria-live="polite"

        >

          <p className="text-sm text-[var(--color-text-muted)]">

            Loading CMS…

          </p>

        </div>

      ) : (

        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">

          {remoteHydrateError ? (

            <p role="alert" className="sr-only">

              {remoteHydrateError}

            </p>

          ) : null}

          <AdminTopbar

            title={title}

            description={description}

            onOpenMenu={() => setNavOpen(true)}

          />

          <main

            className={cn(

              'min-h-0 min-w-0 flex-1 overflow-hidden',

              isWide

                ? 'flex flex-col px-4 py-4 sm:px-5 lg:px-6 lg:py-5'

                : 'overflow-y-auto px-4 py-6 pb-8 sm:px-6 lg:px-8 lg:py-10 lg:pb-8',

            )}

          >

            <div

              className={cn(

                'mx-auto min-w-0 w-full',

                isWide

                  ? 'flex min-h-0 flex-1 flex-col overflow-hidden'

                  : 'max-w-5xl space-y-6',

                !isWide && 'max-w-5xl',

                isWide && 'max-w-[1600px]',

              )}

            >

              {children}

            </div>

          </main>

        </div>

      )}



      <Drawer

        placement="left"

        open={navOpen}

        onClose={() => setNavOpen(false)}

        aria-label="Admin navigation"

        className="overflow-hidden p-0 !w-[var(--admin-sidebar-width,17rem)] !max-w-[var(--admin-sidebar-width,17rem)]"
      >
        <AdminSidebar
          density="drawer"
          onNavigate={() => setNavOpen(false)}
          className="h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-1 overflow-hidden border-r-0"
        />

      </Drawer>

    </div>

  )

}

