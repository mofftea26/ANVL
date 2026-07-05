import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminLandingContentEditor } from '@/features/admin/landing-content/AdminLandingContentEditor'

export function AdminContentPageRoute() {
  return (
    <AdminLayout
      title="Landing Content"
      description="Per-scene copy overrides with designed defaults."
      layout="workspace"
    >
      <AdminLandingContentEditor />
    </AdminLayout>
  )
}
