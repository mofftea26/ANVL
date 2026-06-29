import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPdpContentEditor } from '@/features/admin/products-content/AdminPdpContentEditor'

export function AdminProductsPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Products"
        description="Per-product detail-page content and editorial assets."
        layout="workspace"
      >
        <AdminPdpContentEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
