import { LegalEditor } from '@/features/admin/legal/LegalEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminLegalPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <LegalEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
