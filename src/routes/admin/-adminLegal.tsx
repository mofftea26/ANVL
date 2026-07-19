import { LegalEditor } from '@/features/admin/legal/LegalEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminLegalPageRoute() {
  return (
    <AdminLayout
      title="Legal"
      description="Privacy, terms, cookies, and accessibility copy — every blank field falls back to the designed default."
      layout="workspace"
    >
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <LegalEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
