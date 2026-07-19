import { AboutEditor } from '@/features/admin/about/AboutEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminAboutPageRoute() {
  return (
    <AdminLayout
      title="About Page"
      description="Author the cinematic About page — hero, philosophy, forge process, fun facts, and finale."
      layout="workspace"
    >
      {/* Page-level fallback; hero/orb/marquee sections claim their own hover. */}
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <AboutEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
