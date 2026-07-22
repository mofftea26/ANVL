import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'
import { ShopExperienceEditor } from '@/features/admin/shop-experience/ShopExperienceEditor'

export function AdminShopPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'shop:grid' }}>
        <ShopExperienceEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
