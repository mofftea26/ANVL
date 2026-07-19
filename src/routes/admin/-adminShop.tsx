import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'
import { ShopExperienceEditor } from '@/features/admin/shop-experience/ShopExperienceEditor'

export function AdminShopPageRoute() {
  return (
    <AdminLayout
      title="Shop Experience"
      description="Layout, behavior, and copy for the storefront shop."
      layout="workspace"
    >
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'shop:grid' }}>
        <ShopExperienceEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
