import { ComingSoonEditor } from '@/features/admin/coming-soon/ComingSoonEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminComingSoonPageRoute() {
  return (
    <AdminLayout
      title="Coming Soon"
      description="Pre-launch site mode — toggle the reveal page and author its copy, countdown, early-access capture, assets, and SEO."
      layout="workspace"
    >
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'coming-soon:page' }}>
        <ComingSoonEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
