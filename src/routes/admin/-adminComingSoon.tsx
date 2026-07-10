import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ComingSoonEditor } from '@/features/admin/coming-soon/ComingSoonEditor'

export function AdminComingSoonPageRoute() {
  return (
    <AdminLayout
      title="Coming Soon"
      description="Pre-launch site mode — toggle the reveal page and author its copy, countdown, early-access capture, assets, and SEO."
      layout="workspace"
    >
      <ComingSoonEditor />
    </AdminLayout>
  )
}
