import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ShopExperienceEditor } from '@/features/admin/shop-experience/ShopExperienceEditor'

export function AdminShopPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Shop Experience"
        description="Layout, behavior, and copy for the storefront shop."
        layout="workspace"
      >
        <ShopExperienceEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
