import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { DropsAdminList } from '@/features/admin/drops/DropsAdminList'

export function AdminDropsIndexPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Drops"
        description="Listing toolbar handles search, filters, and lifecycle actions (⋯ menu). Only one drop can be active on the storefront."
        layout="wide"
      >
        <DropsAdminList />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
