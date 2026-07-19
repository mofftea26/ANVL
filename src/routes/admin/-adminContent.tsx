import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminLandingContentEditor } from '@/features/admin/landing-content/AdminLandingContentEditor'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminContentPageRoute() {
  return (
    <AdminLayout
      title="Landing Content"
      description="Per-scene copy overrides with designed defaults."
      layout="workspace"
    >
      {/* Page-level fallback; each scene's ContentSection claims its own hover. */}
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <AdminLandingContentEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
