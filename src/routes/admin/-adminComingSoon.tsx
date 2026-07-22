import { ComingSoonEditor } from '@/features/admin/coming-soon/ComingSoonEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'
import { previewFieldAnchorId } from '@/features/cms/preview'

export function AdminComingSoonPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminPreviewHoverScope
        target={{ kind: 'content-field', id: 'coming-soon:page' }}
        anchorId={previewFieldAnchorId('coming-soon:page')}
      >
        <ComingSoonEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
