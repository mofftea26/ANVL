import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { DropsAdminList } from '@/features/admin/drops/DropsAdminList'

export function AdminDropsIndexPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Drops"
        description="Only one drop can be active at a time on the public site."
        layout="wide"
      >
        <DropsAdminList />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
