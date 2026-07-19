import { SupportEditor } from '@/features/admin/support/SupportEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminSupportPageRoute() {
  return (
    <AdminLayout
      title="Support"
      description="FAQ, contact, shipping, returns, care, and size guides — every blank field falls back to the designed default."
      layout="workspace"
    >
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <SupportEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
