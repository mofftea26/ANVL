import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { DropsAdminList } from '@/features/admin/drops/DropsAdminList'

export function AdminDropsIndexPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout title="Drops" layout="wide">
        <DropsAdminList />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
