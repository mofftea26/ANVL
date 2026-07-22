import { SupportEditor } from '@/features/admin/support/SupportEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminSupportPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <SupportEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
