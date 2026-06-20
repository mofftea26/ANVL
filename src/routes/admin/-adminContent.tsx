import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminLandingContentEditor } from '@/features/admin/landing-content/AdminLandingContentEditor'

export function AdminContentPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Landing Content"
        description="Per-scene copy overrides with designed defaults."
      >
        <AdminLandingContentEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
