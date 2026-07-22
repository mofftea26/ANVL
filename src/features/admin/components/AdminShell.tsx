import { Suspense, lazy, useEffect, useState, type PropsWithChildren } from 'react'

import { subscribePreviewFocus } from '@/features/admin/preview/adminPreviewStore'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import { Drawer } from '@/shared/components/ui/Drawer'
import { cn } from '@/shared/lib/cn'

import { AdminPreviewOpenContext } from './AdminShellContext'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'

/** Lazy — the live-preview iframe stack costs nothing until opened. */
const AdminPreviewPanel = lazy(() =>
  import('@/features/admin/preview/AdminPreviewPanel').then((m) => ({
    default: m.AdminPreviewPanel,
  })),
)

const SIDEBAR_PREF_KEY = ADMIN_STORAGE_KEYS.sidebarPref

function readSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_PREF_KEY) === 'rail'
  } catch {
    return false
  }
}

function persistSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_PREF_KEY, collapsed ? 'rail' : 'expanded')
  } catch {
    // Preference only — safe to drop when storage is unavailable.
  }
}

/**
 * Admin chrome: persistent categorized sidebar (≥1024px, collapsible to an
 * icon rail with the preference persisted) beside topbar + main, plus the
 * toggleable live-preview panel docked on the right. Below `lg` the sidebar
 * becomes the existing overlay drawer, opened from the topbar menu button.
 *
 * Mounted ONCE at the admin route level around the child `<Outlet/>` — it
 * survives navigation between admin pages, so sidebar collapse state, the
 * open preview panel (and its iframe), and topbar chrome all persist. Page
 * titles resolve inside {@link AdminTopbar} from the nav registry; the child
 * pages wrap themselves in `AdminLayout` for content width.
 */
export function AdminShell({ children }: PropsWithChildren) {
  const [navOpen, setNavOpen] = useState(false)
  // Default expanded on server + first paint; stored preference applies post-mount.
  const [collapsed, setCollapsed] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setCollapsed(readSidebarCollapsed())
  }, [])

  // A locate request from any editor opens the preview panel.
  useEffect(() => {
    return subscribePreviewFocus(() => setPreviewOpen(true))
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      persistSidebarCollapsed(!prev)
      return !prev
    })
  }

  return (
    <AdminPreviewOpenContext.Provider value={previewOpen}>
    <div className="flex h-full min-h-0 min-w-0">
      <div
        className={cn(
          'hidden shrink-0 lg:block',
          collapsed ? 'w-[4.5rem]' : 'w-[var(--admin-sidebar-width,17rem)]',
        )}
      >
        <AdminSidebar
          density={collapsed ? 'rail' : 'default'}
          onToggleCollapse={toggleCollapsed}
          className="h-full"
        />
      </div>

      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Drafting-table grid — the Studio's paper texture. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--color-line) 42%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-line) 42%, transparent) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <AdminTopbar
          onOpenMenu={() => setNavOpen(true)}
          previewOpen={previewOpen}
          onTogglePreview={() => setPreviewOpen((open) => !open)}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 pb-8 sm:px-6 lg:px-8 lg:py-10 lg:pb-8">
            {children}
          </main>

          {previewOpen ? (
            <Suspense fallback={null}>
              <AdminPreviewPanel onClose={() => setPreviewOpen(false)} />
            </Suspense>
          ) : null}
        </div>
      </div>

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
    </AdminPreviewOpenContext.Provider>
  )
}
