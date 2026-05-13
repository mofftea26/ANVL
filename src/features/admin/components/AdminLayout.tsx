import { useState, type PropsWithChildren, type ReactNode } from 'react'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <AdminSidebar className="hidden lg:flex" />

        <div className="flex min-h-screen flex-col">
          <AdminTopbar
            title={title}
            description={description}
            onOpenMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div
              className={cn(
                'mx-auto w-full space-y-6',
                layout === 'wide' ? 'max-w-[1600px]' : 'max-w-5xl',
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <AdminSidebar
          onNavigate={() => setMobileOpen(false)}
          className="h-full border-r-0"
        />
      </Drawer>
    </div>
  )
}
